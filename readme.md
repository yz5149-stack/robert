# robert

**SoHo Site** is a single-page three.js app that shows the semantic model in
[`semantic_model.md`](semantic_model.md).

## Run

ES modules can't load from `file://`, so serve the folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. three.js loads from the jsDelivr CDN.

## Use

- Drag to orbit, scroll to zoom, right-drag to pan.
- Click a street, intersection, building or object to select it. Its attributes
  and relationships show in the right panel, and its actions show in the toolbar.
- When an action breaks a model rule, the change is refused and a message names the rule.
- `Esc` clears the selection. **Reset** restores the example site.

## Files

- `index.html`, `style.css`: page and layout
- `js/model.js`: entities, example data, derived values, rules and actions
- `js/view.js`: three.js scene built from the model
- `js/main.js`: toolbar, info panel, selection
