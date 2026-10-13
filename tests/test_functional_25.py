"""Catalog asset and theme regression tests (standard-library only)."""
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
R=Path(__file__).resolve().parents[1]
H=(R/"index.html").read_text(encoding="utf-8")
J=(R/"src/JS/index.js").read_text(encoding="utf-8")
class Parse(HTMLParser):
    def __init__(self):
        super().__init__();self.nodes=[]
    def handle_starttag(self,tag,attrs):
        self.nodes.append((tag,dict(attrs)))
P=Parse();P.feed(H)
def nodes(tag):return [a for t,a in P.nodes if t==tag]
def cards():return [a for a in nodes("li") if "cartao-pokemon" in a.get("class","").split()]
class CatalogFunctionalTests(unittest.TestCase):
    def test_01_cards_present(self):self.assertEqual(len(cards()),15)
    def test_02_theme_button_unique(self):self.assertEqual(sum(a.get("id")=="botao-alterar-tema" for a in nodes("button")),1)
    def test_03_theme_button_type(self):self.assertEqual(next(a for a in nodes("button") if a.get("id")=="botao-alterar-tema").get("type"),"button")
    def test_04_theme_button_label(self):self.assertTrue(next(a for a in nodes("button") if a.get("id")=="botao-alterar-tema").get("aria-label"))
    def test_05_theme_listener(self):self.assertIn('addEventListener("click"',J)
    def test_06_theme_toggle(self):self.assertIn('classList.toggle("modo-escuro")',J)
    def test_07_theme_dark_check(self):self.assertIn('classList.contains("modo-escuro")',J)
    def test_08_sun_icon_exists(self):self.assertTrue((R/"src/imagens/sun.png").is_file())
    def test_09_moon_icon_exists(self):self.assertTrue((R/"src/imagens/moon.png").is_file())
    def test_10_theme_switches_sun(self):self.assertIn('./src/imagens/sun.png',J)
    def test_11_theme_switches_moon(self):self.assertIn('./src/imagens/moon.png',J)
    def test_12_image_paths_exist(self):
        for a in nodes("img"):
            with self.subTest(src=a.get("src")):self.assertTrue((R/a["src"]).is_file())
    def test_13_images_have_alt(self):
        for a in nodes("img"):self.assertTrue(a.get("alt","").strip())
    def test_14_css_paths_exist(self):
        for a in nodes("link"):
            if a.get("rel")=="stylesheet" and a.get("href","").startswith("./"):
                self.assertTrue((R/a["href"]).is_file())
    def test_15_script_paths_exist(self):
        for a in nodes("script"):self.assertTrue((R/a["src"]).is_file())
    def test_16_pokemon_numbers_unique(self):
        nums=re.findall(r"#(\d{3})",H);self.assertEqual(len(nums),len(set(nums)))
    def test_17_pokemon_numbers_complete(self):
        nums=re.findall(r"#(\d{3})",H);self.assertEqual(nums,[f"{i:03d}" for i in range(1,16)])
    def test_18_all_cards_have_descriptions(self):self.assertEqual(len(re.findall(r'class="descricao"',H)),len(cards()))
    def test_19_all_cards_have_gifs(self):self.assertEqual(len([a for a in nodes("img") if "gif" in a.get("class","").split()]),len(cards()))
    def test_20_all_cards_have_types(self):self.assertEqual(len([a for a in nodes("ul") if "tipos" in a.get("class","").split()]),len(cards()))
    def test_21_all_cards_have_information(self):self.assertEqual(len([a for a in nodes("div") if "informacoes" in a.get("class","").split()]),len(cards()))
    def test_22_main_unique(self):self.assertEqual(len(nodes("main")),1)
    def test_23_header_unique(self):self.assertEqual(len(nodes("header")),1)
    def test_24_no_missing_image_sources(self):self.assertTrue(all(a.get("src") for a in nodes("img")))
    def test_25_no_missing_script_sources(self):self.assertTrue(all(a.get("src") for a in nodes("script")))
if __name__=="__main__":unittest.main()
