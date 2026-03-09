const data = {
    "source": "External Auditor",
    "type": "final_calibration",
    "content": {
        "target_cash": 6532.63,
        "target_in": 34443.55,
        "action": "FORCE_RECONCILIATION",
        "details": "Import all missing transactions from Feb-Sept 2025. Set Cash on Hand correctly."
    }
};

fetch('https://iews-toi-588941282431.asia-southeast1.run.app/api/bridge/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
    .then(res => res.json())
    .then(json => console.log('Response:', json))
    .catch(err => console.error(err));
