import asyncio
import sys
import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from collections import deque
from urllib.parse import urlparse

from playwright.async_api import async_playwright

# -----------------------------
# CONFIG / DEFAULTS
# -----------------------------
DEFAULT_BASE_URL = "http://localhost:5173"
DEFAULT_MAX_PAGES = 50

SKIP_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js", ".ico", ".map", ".woff", ".woff2", ".ttf"}
SKIP_SCHEMES = ("mailto:", "tel:")

# FIX: Windows Console Encoding (Use UTF-8 for Safe Text)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# -----------------------------
# STATE (per run)
# -----------------------------
visited = set()
broken_links = []
console_errors = []
console_warnings = []
network_failures = []
journey_results = []

# -----------------------------
# PATHS (portable)
# -----------------------------
def resolve_titan_root() -> Path:
    env_root = os.environ.get("TITAN_ROOT")
    if env_root:
        return Path(env_root).resolve()
    return Path(__file__).resolve().parents[2]

def get_report_dir(titan_root: Path) -> Path:
    return titan_root / "apps" / "inspector" / "reports"

# -----------------------------
# URL HELPERS
# -----------------------------
def parse_url(url: str):
    return urlparse(url)

def hostname(url: str) -> str:
    try:
        return (parse_url(url).hostname or "").lower()
    except Exception:
        return ""

def normalize_url(url: str) -> str:
    u = url.split("#")[0].rstrip("/")
    return u

def is_same_origin(url: str, base_url: str) -> bool:
    bu = parse_url(base_url)
    uu = parse_url(url)
    b_host = (bu.hostname or "").lower()
    u_host = (uu.hostname or "").lower()
    if b_host != u_host:
        return False
    if bu.port is not None:
        return uu.port == bu.port
    return True

def should_skip_url(url: str) -> bool:
    if not url:
        return True
    url_l = url.lower()
    if url_l.startswith(SKIP_SCHEMES):
        return True
    try:
        pu = parse_url(url)
        path = (pu.path or "").lower()
        for ext in SKIP_EXTS:
            if path.endswith(ext):
                return True
        if "logout" in path:
            return True
    except Exception:
        return True
    return False

# -----------------------------
# CRAWL (QUEUE-BASED)
# -----------------------------
async def crawl(page, start_url: str, base_url: str, max_pages: int):
    start_url = normalize_url(start_url)
    q = deque([start_url])

    while q and len(visited) < max_pages:
        url = normalize_url(q.popleft())
        if url in visited: continue
        if not is_same_origin(url, base_url): continue
        if should_skip_url(url): continue

        print(f"[CRAWL] Crawling: {url}")
        visited.add(url)

        try:
            response = await page.goto(url, wait_until="domcontentloaded", timeout=10000)
            await page.wait_for_timeout(300)

            if not response:
                broken_links.append({"url": url, "status": 0, "reason": "No response object"})
                print(f"[FAIL] Broken: {url} (no response)")
                continue

            if response.status >= 400:
                broken_links.append({"url": url, "status": response.status, "reason": "HTTP Error"})
                print(f"[FAIL] Broken: {url} ({response.status})")
                continue

            hrefs = await page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
            for h in hrefs:
                if not h: continue
                h = normalize_url(h)
                if h in visited: continue
                if not is_same_origin(h, base_url): continue
                if should_skip_url(h): continue
                q.append(h)

        except Exception as e:
            broken_links.append({"url": url, "status": 0, "reason": str(e)})
            print(f"[FAIL] Failed: {url} - {str(e)}")

# -----------------------------
# JOURNEY: GRANTS (INTAKE -> GENERATE)
# -----------------------------
# -----------------------------
# JOURNEY: SHOP (HOME -> PRODUCT -> CART)
# -----------------------------
async def run_journey_shop(page, base_url: str):
    print("[JOURNEY] Starting Journey: Shopper Flow")
    try:
        # 1. Home
        await page.goto(base_url, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1000)
        
        # 2. Click a Product (Find first link containing /product/)
        print("[STEP] Looking for a product...")
        # Try finding a product card link
        product_link = await page.get_attribute("a[href*='/product/']", "href")
        
        if not product_link:
            # Fallback: Look for "Shop" or "New"
            print("[WARN] No product found on home. Trying 'Shop'.")
            await page.click("text=Shop")
            await page.wait_for_timeout(1000)
            product_link = await page.get_attribute("a[href*='/product/']", "href")

        if product_link:
            print(f"[STEP] Navigating to Product: {product_link}")
            if product_link.startswith("http"):
                await page.goto(product_link)
            else:
                await page.goto(f"{base_url}{product_link}" if product_link.startswith("/") else f"{base_url}/{product_link}")
            
            await page.wait_for_timeout(1000)
            
            # 2.5 SELECT SIZE (Critical for Shopper Flow)
            # Find size buttons that are not disabled/out-of-stock
            # Looking for buttons in the size selector area (usually containing text like 'XS', 'S', etc.)
            # A good selector might be: button inside the size area container (border-2 text-sm font-bold)
            # Or by class: 'min-w-[60px]' from the code view
            
            print("[STEP] Selecting a size...")
            # Try to click the first enabled size button
            # We look for a button that has text, inside the size container logic
            size_btn = page.locator("button:has-text('Size'), button:has-text('L'), button:has-text('M'), button:has-text('XL'), button:has-text('Free')").first
            
            # Enhanced selector for the specific UI buttons created in ProductPage.jsx
            # Wrapper: div.flex.flex-wrap.gap-2
            size_buttons = page.locator("div.flex.flex-wrap.gap-2 button:not([disabled])")
            
            if await size_buttons.count() > 0:
                await size_buttons.first.click()
                print(f"[STEP] Selected Size: {await size_buttons.first.inner_text()}")
                await page.wait_for_timeout(500)
            else:
                 print("[WARN] No size buttons found or all OOS. Defaulting to 'Add' anyway.")

            # 3. Add to Cart
            # Look for button "Add to Cart"
            add_btn = page.locator("button:has-text('Add to Cart'), button:has-text('Add To Cart')").first
            if await add_btn.is_visible():
                print("[STEP] Clicking 'Add to Cart'")
                await add_btn.click()
                await page.wait_for_timeout(1000)
                
                # 4. Check Cart
                # Look for Cart Icon or /cart link
                print("[STEP] Going to Cart")
                await page.goto(f"{base_url}/cart")
                await page.wait_for_timeout(1000)
                
                # 5. Verify Item
                # Look for "Checkout" or non-empty list
                has_items = await page.get_by_text("Checkout").is_visible() or await page.get_by_text("Total").is_visible()
                
                if has_items:
                     journey_results.append({"name": "Shopper Flow", "status": "PASS"})
                     print("[PASS] Shopper Flow Passed (Item in Cart)")
                else:
                     journey_results.append({"name": "Shopper Flow", "status": "FAIL", "error": "Cart appears empty after add"})
                     print("[FAIL] Cart Empty")
            else:
                print("[SKIP] 'Add to Cart' button not found (Out of Stock?)")
                journey_results.append({"name": "Shopper Flow", "status": "WARN", "error": "No Add Button"})
        else:
             print("[FAIL] Could not find any product link")
             journey_results.append({"name": "Shopper Flow", "status": "FAIL", "error": "No Products Found"})

    except Exception as e:
        journey_results.append({"name": "Shopper Flow", "status": "FAIL", "error": str(e)})
        print(f"[FAIL] Shopper Flow Failed: {str(e)}")

# -----------------------------
# REPORTING
# -----------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat()

def write_reports(report_dir: Path, report: dict, is_healthy: bool):
    latest = report_dir / "latest"
    latest.mkdir(parents=True, exist_ok=True)
    
    report_file = latest / "audit.json"
    print(f"[DEBUG] Writing to: {report_file}")
    report_file.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    status_emoji = "[PASS]" if is_healthy else "[FAIL]"
    md = []
    md.append("# TITAN Inspector Report")
    md.append(f"Date: {datetime.now().isoformat()}")
    md.append("")
    md.append(f"# Status: {status_emoji}")
    md.append("")

    if report["broken_links"]:
        md.append("## [X] Broken Links")
        md.extend([f"- {l['url']}: {l['reason']} ({l.get('status', 0)})" for l in report["broken_links"]])
        md.append("")

    if report["console_errors"]:
        md.append("## [X] Console Errors")
        md.extend([f"- {e}" for e in report["console_errors"]])
        md.append("")

    if report["journeys"]:
        md.append("## [JOURNEY] Journeys")
        md.extend([f"- {j['name']}: {j['status']} {j.get('error','')}".rstrip() for j in report["journeys"]])
        md.append("")

    if report["network_failures"]:
        md.append("## [WARN] Network Failures")
        md.extend([f"- {n}" for n in report["network_failures"]])
        md.append("")

    if report["console_warnings"]:
        md.append("## [INFO] Console Warnings")
        md.extend([f"- {w}" for w in report["console_warnings"]])
        md.append("")

    (latest / "audit.md").write_text("\n".join(md).strip() + "\n", encoding="utf-8")

# -----------------------------
# MAIN
# -----------------------------
async def main():
    global STRICT_MODE, DEFAULT_MAX_PAGES

    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help="Start URL for crawl (or base URL)")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Base URL used for same-origin checks")
    parser.add_argument("--mode", default="crawl", choices=["crawl", "journey", "both"])
    parser.add_argument("--strict", action="store_true", help="Strict mode: fail on any console error and broken links")
    parser.add_argument("--strict-warnings", action="store_true", help="If set, warnings also fail the run")
    parser.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES)
    args = parser.parse_args()

    strict_mode = args.strict
    strict_warnings = args.strict_warnings
    max_pages = args.max_pages
    base_url = args.base_url.rstrip("/")

    titan_root = resolve_titan_root()
    report_dir = get_report_dir(titan_root)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="TITAN-Inspector/1.0",
            extra_http_headers={"X-Titan-Inspector": "1"},
        )
        page = await context.new_page()

        def console_handler(msg):
            try:
                if not msg.text: return
                text = msg.text.lower()
                if "fonts.gstatic" in text: return
                if "blocked by cors" in text or ("cors" in text and "font" in text): return
                # FILTER: Redundant network errors (captured by request_failed)
                if "failed to load resource" in text: return
                
                if msg.type == "error":
                    console_errors.append(msg.text)
                elif msg.type == "warning":
                    console_warnings.append(msg.text)
            except Exception:
                pass

        def request_failed(req):
            try:
                if not req.url: return
                if "fonts.gstatic" in req.url.lower(): return
                failure = req.failure
                network_failures.append(f"{req.method} {req.url} - {failure}")
            except Exception:
                network_failures.append(f"{req.method} {req.url if req else 'UNKNOWN'} - requestfailed")

        page.on("console", console_handler)
        page.on("requestfailed", request_failed)

        try:
            if args.mode == "crawl":
                await crawl(page, args.url, base_url, max_pages)
            elif args.mode == "journey":
                await run_journey_shop(page, base_url)
            elif args.mode == "both":
                await run_journey_shop(page, base_url)
                await crawl(page, args.url, base_url, max_pages)

        except Exception as e:
            print(f"[FAIL] CRITICAL INSPECTOR CRASH: {e}")
            broken_links.append({"url": "INSPECTOR_CORE", "status": 500, "reason": str(e)})

        finally:
            await browser.close()

            report = {
                "timestamp": now_iso(),
                "status": "UNKNOWN",
                "base_url": base_url,
                "start_url": args.url,
                "mode": args.mode,
                "max_pages": max_pages,
                "visited_count": len(visited),
                "broken_links": broken_links,
                "console_errors": console_errors,
                "console_warnings": console_warnings,
                "network_failures": network_failures,
                "journeys": journey_results,
            }

            is_healthy = (
                not broken_links
                and not console_errors
                and (not journey_results or all(j.get("status") == "PASS" for j in journey_results))
                and (not strict_warnings or not console_warnings)
            )

            report["status"] = "PASS" if is_healthy else "FAIL"
            write_reports(report_dir, report, is_healthy)

            status_emoji = "[PASS]" if is_healthy else "[FAIL]"
            print(f"Report Generated: {status_emoji}")
            sys.exit(0 if is_healthy else 1)

if __name__ == "__main__":
    asyncio.run(main())

