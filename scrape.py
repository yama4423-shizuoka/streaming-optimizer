import requests
from bs4 import BeautifulSoup

url = "https://books.toscrape.com/"
response = requests.get(url)

soup = BeautifulSoup(response.text, "html.parser")

books = soup.select("article.product_pod")

for book in books:
    title = book.select_one("h3 a")["title"]
    price = book.select_one("p.price_color").text
    print(title, price)
