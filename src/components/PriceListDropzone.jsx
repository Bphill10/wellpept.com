import React, { useRef, useState } from "react";
import { FileSpreadsheet, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { parsePriceListFile, parsePriceListText } from "../utils/parsePriceList";

const ACCEPT =
  ".xlsx,.xls,.xlsm,.csv,.tsv,.txt,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain";

export default function PriceListDropzone({ onParsed }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  async function handleFiles(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setStatus(null);
    try {
      const result = await parsePriceListFile(file);
      if (!result.count) {
        setError(
          `Couldn’t find price rows in “${file.name}”. Try a sheet with Product + Price columns, or paste lines like “BPC-157 10mg $80”.`
        );
        return;
      }
      setStatus({
        fileName: result.fileName,
        count: result.count,
        method: result.method,
      });
      onParsed(result.lines, result);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Couldn’t read that file. Use Excel (.xlsx), CSV, TXT, or PDF with selectable text."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePasteParse() {
    if (!pasteText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await parsePriceListText(pasteText);
      if (!result.count) {
        setError(
          "No rows detected. Paste lines with a name and a price (e.g. Tirzepatide 10mg 80)."
        );
        return;
      }
      setStatus({
        fileName: "Pasted text",
        count: result.count,
        method: "paste",
      });
      onParsed(result.lines, result);
      setPasteOpen(false);
    } catch (err) {
      setError(err?.message || "Paste parse failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="price-dropzone-wrap">
      <div
        className={`price-dropzone ${dragging ? "dragging" : ""} ${busy ? "busy" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="price-dropzone-icon" aria-hidden="true">
          {busy ? <Loader2 className="spin" size={28} /> : <Upload size={28} />}
        </div>
        <div>
          <strong>
            {busy ? "Reading your price list…" : "Drop Excel, PDF, or CSV here"}
          </strong>
          <p>
            Auto-fills the review table from .xlsx, .xls, .csv, .txt, or text PDFs.
            Then edit anything before you submit.
          </p>
        </div>
        <span className="price-dropzone-btn">
          <FileSpreadsheet size={16} /> Choose file
        </span>
      </div>

      <div className="price-dropzone-alt">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => setPasteOpen((v) => !v)}
        >
          Or paste a list instead
        </button>
      </div>

      {pasteOpen && (
        <div className="price-paste panel">
          <label className="field">
            Paste rows (name + strength + price)
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"BPC-157 10mg $80\nTirzepatide 30mg 160\nRetatrutide 12mg 100"}
            />
          </label>
          <button
            type="button"
            className="primary-btn"
            disabled={busy || !pasteText.trim()}
            onClick={handlePasteParse}
          >
            Parse pasted list
          </button>
        </div>
      )}

      {status && (
        <div className="notice ok fade">
          <CheckCircle2 size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
          Loaded <strong>{status.count}</strong> line
          {status.count === 1 ? "" : "s"} from {status.fileName}. Review below,
          then submit.
        </div>
      )}
      {error && <div className="notice warn fade">{error}</div>}
    </div>
  );
}
