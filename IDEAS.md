# streaming-optimizer バックログ

## バグ修正

### [軽微] 予算スライダー単独変更がlocalStorageに保存されない (QA検出 2026-06-22)

`localStorageによる選択状態永続化`(3db709b)において、`onBudgetChange()` は `budget` 変数を更新するが `syncUI()` を呼ばない。そのため予算スライダーのみ変更してカード選択なしでページをリロードすると `budget` が 0 に戻る。カード選択のたびに `syncUI()` → `saveLocalData()` が呼ばれるため、カード操作と組み合わせる通常フローでは問題は発生しない。
