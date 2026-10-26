import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, X, ArrowRight, Download } from 'lucide-react';
import { db } from '../../services/db';
import { formatINR } from '../../utils/formatters';

export const AdminCsvImportModal: React.FC = () => {
  const [csvContent, setCsvContent] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<{ imported: number } | null>(null);

  const sampleCsv = `Name,SKU,Category,Selling_Price,Purchase_Cost,Stock,Description
"V2 Floral Summer Nighty",V2-NGT-SMP-01,Nighty,499.00,280.00,30,"100% pure cotton daily nighty"
"V2 Cotton Ribbed Camisole",V2-BAN-SMP-01,Banians,249.00,110.00,50,"Soft spaghetti strap inner camisole"
"V2 Cotton Mermaid Inskirt",V2-INS-SMP-01,Inskirts (Pavadai),299.00,140.00,40,"6-cut poplin saree underskirt"`;

  const handleValidate = async () => {
    if (!csvContent.trim()) {
      alert('Please paste or upload CSV text first.');
      return;
    }
    setIsValidating(true);
    setValidationErrors([]);
    setImportStatus(null);

    try {
      const res = await db.previewAndValidateCsv(csvContent);
      setPreviewRows(res.validRows);
      setValidationErrors(res.errors);
    } catch (err: any) {
      setValidationErrors([err.message]);
      setPreviewRows([]);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (previewRows.length === 0) return;
    try {
      const count = await db.executeBatchImport(previewRows);
      setImportStatus({ imported: count });
      setPreviewRows([]);
      setCsvContent('');
    } catch (err: any) {
      alert('Error during batch import: ' + err.message);
    }
  };

  const loadSample = () => {
    setCsvContent(sampleCsv);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Bulk Product CSV Import
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Safely import new dresses with header validation, SKU duplicate detection, and category matching
        </p>
      </div>

      {/* CSV Input Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-rose-700" />
            <h3 className="font-serif text-base font-bold text-stone-900">
              CSV Data Input
            </h3>
          </div>
          <button
            onClick={loadSample}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            Load Sample CSV Template
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">
            Paste comma-separated rows (Headers: <code>Name, SKU, Category, Selling_Price, Purchase_Cost, Stock, Description</code>)
          </label>
          <textarea
            rows={7}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder="Paste your CSV content here..."
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleValidate}
            disabled={isValidating || !csvContent.trim()}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            {isValidating ? 'Validating CSV...' : 'Validate & Preview Rows'}
          </button>
        </div>

        {/* Validation Errors Table */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{validationErrors.length} Validation Warning(s) / Error(s) Found:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Alert */}
        {importStatus && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-bold">Batch Import Successfully Completed!</p>
              <p className="mt-0.5">Imported {importStatus.imported} new products into the V2 store catalogue.</p>
            </div>
          </div>
        )}
      </div>

      {/* Validated Rows Preview */}
      {previewRows.length > 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Ready to Import ({previewRows.length} Valid Products)
              </h3>
              <p className="text-xs text-stone-500">
                Review verified rows before applying database insertion
              </p>
            </div>

            <button
              onClick={handleExecuteImport}
              className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Confirm & Batch Import</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Matched Category</th>
                  <th className="py-2.5 px-3">Price (₹)</th>
                  <th className="py-2.5 px-3">Stock Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {previewRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 font-semibold text-stone-900">{r.name}</td>
                    <td className="py-2.5 px-3 font-mono text-stone-500">{r.sku}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">{r.category_name}</td>
                    <td className="py-2.5 px-3 font-bold font-sans">{formatINR(r.selling_price_paise)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-800">{r.stock} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
