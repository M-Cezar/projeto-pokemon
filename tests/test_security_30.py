"""30 independently executable checks for the static Pokemon catalog."""
import re
import unittest
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/"index.html").read_text(encoding="utf-8")
JS=(ROOT/"src/JS/index.js").read_text(encoding="utf-8")
WF=(ROOT/".github/workflows/security.yml").read_text(encoding="utf-8")
class Parser(HTMLParser):
    def __init__(self): super().__init__(); self.nodes=[]
    def handle_starttag(self,tag,attrs): self.nodes.append((tag,dict(attrs)))
P=Parser();P.feed(HTML)
def meta(k): return [a.get("content","") for t,a in P.nodes if t=="meta" and (a.get("name")==k or a.get("http-equiv")==k)]
def no(p,s=HTML): return re.search(p,s,re.I|re.M) is None
class PokemonSecurityTests(unittest.TestCase):
    def test_01_doctype(self): self.assertTrue(HTML.lstrip().lower().startswith("<!doctype html>"))
    def test_02_single_html(self): self.assertEqual(sum(t=="html" for t,a in P.nodes),1)
    def test_03_single_head(self): self.assertEqual(sum(t=="head" for t,a in P.nodes),1)
    def test_04_single_body(self): self.assertEqual(sum(t=="body" for t,a in P.nodes),1)
    def test_05_charset(self): self.assertTrue(any(a.get("charset","").lower()=="utf-8" for t,a in P.nodes if t=="meta"))
    def test_06_viewport(self): self.assertTrue(meta("viewport"))
    def test_07_referrer(self): self.assertEqual(meta("referrer"),["no-referrer"])
    def test_08_csp(self): self.assertEqual(len(meta("Content-Security-Policy")),1)
    def test_09_default_deny(self): self.assertIn("default-src 'none'",meta("Content-Security-Policy")[0])
    def test_10_scripts_local(self): self.assertIn("script-src 'self'",meta("Content-Security-Policy")[0])
    def test_11_no_connect(self): self.assertIn("connect-src 'none'",meta("Content-Security-Policy")[0])
    def test_12_no_object(self): self.assertIn("object-src 'none'",meta("Content-Security-Policy")[0])
    def test_13_no_base(self): self.assertIn("base-uri 'none'",meta("Content-Security-Policy")[0])
    def test_14_no_forms(self): self.assertIn("form-action 'none'",meta("Content-Security-Policy")[0])
    def test_15_no_frames(self): self.assertIn("frame-src 'none'",meta("Content-Security-Policy")[0])
    def test_16_no_inline_script(self): self.assertTrue(all(a.get("src") for t,a in P.nodes if t=="script"))
    def test_17_no_remote_script(self): self.assertTrue(all(not a.get("src","").startswith(("http:","https:","//")) for t,a in P.nodes if t=="script"))
    def test_18_no_inline_handlers(self): self.assertTrue(all(not any(k.lower().startswith("on") for k in a) for t,a in P.nodes))
    def test_19_no_iframes(self): self.assertFalse(any(t=="iframe" for t,a in P.nodes))
    def test_20_no_form_elements(self): self.assertFalse(any(t=="form" for t,a in P.nodes))
    def test_21_no_eval(self): self.assertTrue(no(r"\beval\s*\(",JS))
    def test_22_no_innerhtml(self): self.assertTrue(no(r"\.innerHTML\s*=",JS))
    def test_23_no_document_write(self): self.assertTrue(no(r"document\.write\s*\(",JS))
    def test_24_no_dynamic_function(self): self.assertTrue(no(r"new\s+Function\s*\(",JS))
    def test_25_no_network_calls(self): self.assertTrue(no(r"\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b",JS))
    def test_26_no_js_urls(self): self.assertTrue(no(r"javascript\s*:",HTML+JS))
    def test_27_no_private_key(self): self.assertTrue(no(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",HTML+JS))
    def test_28_no_github_token(self): self.assertTrue(no(r"github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,}",HTML+JS))
    def test_29_ci_on_pr_and_main(self): self.assertIn("pull_request:",WF);self.assertIn("branches: [main]",WF)
    def test_30_ci_readonly_pinned(self): self.assertRegex(WF,r"contents:\s*read");self.assertRegex(WF,r"actions/checkout@[a-f0-9]{40}")
if __name__=="__main__": unittest.main()
