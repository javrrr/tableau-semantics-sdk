# Test fixtures

Sanitized request/response shapes for the Tableau Semantics Layer surface,
derived from live v65 round-trips.

**All values are neutral placeholders** — model/SDO/field names, aliases, and row
values are invented (`Example_Model`, `Example_SDO`, `Tier A`, …). Nothing here
comes from any real org, customer, or dataset.

- `semantic-query.*` — a live-verified `semanticQuery.query` request that returns
  a 200, and its response. Note the per-field roles (`row_grouping` for a
  dimension, `semantic_aggregation_method` for a measure), that `table_name` is
  the SDO apiName, and that `queryData.rows` are **positional** value arrays
  mapped via `queryMetadata.fields[alias].placeInOrder`.
