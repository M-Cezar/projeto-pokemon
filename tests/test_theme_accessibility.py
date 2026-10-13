"""Theme button accessibility and executable click regression tests."""
import re
import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ThemeAccessibilityTests(unittest.TestCase):
    def test_theme_button_exposes_initial_accessible_state(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertRegex(html, r'<button[^>]+id="botao-alterar-tema"[^>]+aria-pressed="false"')

    def test_click_updates_visual_and_accessibility_state(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("Node.js not available to execute browser-script regression")
        script = r"""
const fs = require('fs');
const vm = require('vm');
let dark = false;
let click;
const attrs = {};
const button = {
  setAttribute(name, value) { attrs[name] = value; },
  addEventListener(name, cb) { if (name === 'click') click = cb; }
};
const image = { src: './src/imagens/sun.png', setAttribute(name, value) { this[name] = value; } };
const body = { classList: {
  contains(name) { return name === 'modo-escuro' && dark; },
  toggle(name) { if (name !== 'modo-escuro') throw Error('bad class'); dark = !dark; }
}};
const document = {
  getElementById() { return button; },
  querySelector(name) { return name === 'body' ? body : image; }
};
vm.runInNewContext(fs.readFileSync('src/JS/index.js', 'utf8'), { document });
if (!click) throw Error('missing click handler');
click();
if (!dark || attrs['aria-pressed'] !== 'true' || !image.src.endsWith('/moon.png')) throw Error('dark theme regression');
click();
if (dark || attrs['aria-pressed'] !== 'false' || !image.src.endsWith('/sun.png')) throw Error('light theme regression');
"""
        result = subprocess.run([node, "-e", script], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

if __name__ == "__main__":
    unittest.main()
