import React from "react";
import Loader from "./loader";
import { Download, Plus, FolderPlus } from "lucide-react";

/**
 * @typedef {Object} TableColumn
 * @property {string} key
 * @property {string} header
 * @property {string} [minWidth]
 * @property {function} [render]
 */

/**
 * @param {Object} props
 * @param {TableColumn[]} props.columns
 * @param {any[]} props.data
 * @param {boolean} [props.loading]
 * @param {string} [props.error]
 * @param {string} [props.emptyMessage]
 * @param {string|number|null} [props.highlightedId]
 * @param {string} [props.idKey]
 * @param {function} [props.onRowClick]
 */
function DataTable({
    columns,
    data,
    loading = false,
    error,
    emptyMessage = "No data found.",
    highlightedId,
    idKey = "id",
    onRowClick,
}) {
    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-white rounded-sm border border-gray-200 sudo">
                <div className="flex flex-col items-center gap-2">
                    <Loader />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-white rounded-sm border border-gray-200 sudo">
                <p className="text-sm text-rose-500">{error}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full min-h-[77vh] flex flex-col items-center justify-center bg-white rounded-sm border border-gray-200 sudo">
                <FolderPlus className="w-10 h-10 font-normal text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-0 sudo">
            <div className="w-full max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto border border-gray-200 rounded-sm no-scrollbar">
                <table className="w-full border-collapse bg-white">
                    <thead className="sticky top-0 z-10">
                        <tr className="text-left text-xs text-gray-800 bg-gray-100 border-b border-gray-200">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="font-medium py-3 px-4 uppercase"
                                    style={{ minWidth: column.minWidth || "150px" }}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {data.map((row, rowIndex) => {
                            const rowId = row[idKey];
                            const isHighlighted = highlightedId !== null && rowId === highlightedId;
                            return (
                                <tr
                                    key={rowId || rowIndex}
                                    onClick={() => onRowClick?.(row)}
                                    className={`border-b border-gray-200 transition-colors ${isHighlighted
                                        ? "bg-green-50 outline outline-green-400"
                                        : "hover:bg-gray-50"
                                        } ${onRowClick ? "cursor-pointer" : ""}`}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="py-3 px-4">
                                            {column.render ? (
                                                column.render(row, rowIndex)
                                            ) : (
                                                <span className="text-sm text-gray-900">
                                                    {row[column.key]}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DataTable;
