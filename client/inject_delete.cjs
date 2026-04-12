const fs = require('fs');
let content = fs.readFileSync('e:/Antigravity/TOI/client/src/pages/SuperadminDashboard.jsx', 'utf8');

const target1 = `        } catch (e) { console.warn('Knowledge load:', e.message); }
    };
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({`;

const replacement1 = `        } catch (e) { console.warn('Knowledge load:', e.message); }
    };
    
    const handleDeleteKnowledgeDoc = async (e, docId) => {
        e.stopPropagation();
        if(!window.confirm("Are you sure you want to delete this document from the vault?\\\\nIt will be completely un-indexed.")) return;
        try {
            await axios.delete(\`/api/knowledge/documents/\${docId}\`, { headers: headers() });
            setKnowledgeDocs(prev => prev.filter(d => d._id !== docId));
            if(selectedDoc?._id === docId) setSelectedDoc(null);
            showToast("Document deleted successfully");
        } catch (err) {
            console.error('Error deleting document', err);
            showToast("Failed to delete document", "error");
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({`;

content = content.replace(target1, replacement1);

const target2 = `<p className="font-bold text-white text-sm line-clamp-2 leading-tight">{doc.title}</p>`;

const replacement2 = `<div className="flex justify-between items-start gap-2">
                                                <p className="font-bold text-white text-sm line-clamp-2 leading-tight flex-1">{doc.title}</p>
                                                <button 
                                                    onClick={(e) => handleDeleteKnowledgeDoc(e, doc._id)}
                                                    className="opacity-50 hover:opacity-100 text-red-500 transition-opacity p-1"
                                                    title="Delete Document"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>`;

// Use global replace for the title replacement just in case there are multiple
content = content.split(target2).join(replacement2);

fs.writeFileSync('e:/Antigravity/TOI/client/src/pages/SuperadminDashboard.jsx', content, 'utf8');
