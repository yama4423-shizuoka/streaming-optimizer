# streaming-optimizer バックログ

## バグ修正

### [軽微] mobileAddFromDB()がrenderRanking()を呼ばないためモバイル追加時にランキング表示が即時更新されない (QA検出 2026-07-03)

953d917a(モバイル「作品追加」タブ実装)で追加された `mobileAddFromDB()` が
`renderSelList()` と `syncUI()` のみを呼び、`toggle()` が呼ぶ `renderRanking()` を
呼ばない。このためモバイルで作品を追加した後、ランキングパネルが即時更新されない可能性がある。
修正方針: `mobileAddFromDB()` の末尾に `renderRanking()` 呼び出しを追加する。

### [要対応] renderSelList()内の${it.e}がesc()なしでinnerHTMLに挿入されている (QA検出 2026-07-03)

`renderSelList()` で `ul.innerHTML = allItems()...map(it => \`...<span class="sel-em">${it.e}</span>...\`)` と
記述されており、カスタム追加作品の絵文字フィールド `it.e` が `esc()` を通さずに展開される。
`addCustomManual()` でユーザー入力が直接セットされるため `<img src=x onerror=...>` 等の
HTMLが注入可能(自己XSS)。Supabaseクラウド保存が有効な場合、別セッションにも影響する。
修正方針: `${it.e}` を `${esc(it.e)}` に変更する。

### [軽微] removeItem()でカスタム追加作品がグリッドから即時消えないリグレッション (QA検出 2026-07-03)

d3a8573d(差分更新最適化)で `removeItem()` から `renderGrid()` 呼び出しを除去した副作用。
DB作品(id 1-636)のdeselect操作には問題なし。ただしカスタム追加作品(id 2000+)を
`removeItem()` で削除した場合、`customItems` 配列からは除去されるが、グリッド上のカードは
deselectedの状態で残留する。ユーザーが再クリックすると `toggle()` -> `selected.add(id)` が
実行されるが該当idは `customItems` に存在しないため、`selected` と `customItems` の不整合が生じる。
次のfilter変更・ジャンル切替で `renderGrid()` が呼ばれるまで残留状態が続く。
修正方針: `removeItem()` 内でカスタム作品の場合に限り `renderGrid()` を呼ぶ分岐を追加する。

### [軽微] 予算スライダー単独変更がlocalStorageに保存されない (QA検出 2026-06-22)

`localStorageによる選択状態永続化`(3db709b)において、`onBudgetChange()` は `budget` 変数を更新するが `syncUI()` を呼ばない。そのため予算スライダーのみ変更してカード選択なしでページをリロードすると `budget` が 0 に戻る。カード選択のたびに `syncUI()` -> `saveLocalData()` が呼ばれるため、カード操作と組み合わせる通常フローでは問題は発生しない。
