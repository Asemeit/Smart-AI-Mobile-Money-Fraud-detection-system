export function verdictMeta(verdict) {
  if (verdict === 'UNSUPPORTED') {
    return {
      className: 'result-unsupported',
      alertClass: 'risk-alert-neutral',
      toastType: 'warning',
      label: 'Not supported',
      action: 'Bank statement — not mobile money',
      icon: 'alert',
      message: 'MoMo Shield verifies M-Pesa, MTN MoMo, and Airtel Money SMS receipts only. Paste the payment SMS, not a bank statement.',
      toastTitle: 'Unsupported document',
      toastMessage: 'This looks like a bank statement. Paste the mobile money SMS instead.',
    };
  }
  if (verdict === 'HIGH_RISK') {
    return {
      className: 'result-high',
      alertClass: 'risk-alert-danger',
      toastType: 'danger',
      label: 'High risk',
      action: 'STOP — Do not release goods',
      icon: 'alert',
      message: 'This receipt shows signs of fraud. Do not hand over any goods or services.',
      toastTitle: 'High risk detected',
      toastMessage: 'Do not release goods. This receipt looks fraudulent.',
    };
  }
  if (verdict === 'SUSPICIOUS') {
    return {
      className: 'result-warn',
      alertClass: 'risk-alert-warning',
      toastType: 'warning',
      label: 'Suspicious',
      action: 'CAUTION — Verify in your app first',
      icon: 'alert',
      message: 'Some red flags were found. Confirm the payment in your official mobile money app before releasing goods.',
      toastTitle: 'Suspicious receipt',
      toastMessage: 'Proceed with caution. Confirm payment in your M-Pesa / MoMo app.',
    };
  }
  return {
    className: 'result-ok',
    alertClass: 'risk-alert-success',
    toastType: 'success',
    label: 'Likely genuine',
    action: 'SAFE — Likely genuine',
    icon: 'check',
    message: 'No major red flags found. Still confirm the payment in your mobile money app before releasing goods.',
    toastTitle: 'Likely genuine',
    toastMessage: 'No major red flags. Confirm in your app before releasing goods.',
  };
}
