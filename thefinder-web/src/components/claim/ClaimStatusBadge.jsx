const styles = {
  SUBMITTED: 'bg-[#ff8a47] text-black',
  PENDING: 'bg-[#d9d9d9] text-[#777]',
  REVIEWING: 'bg-[#d9d9d9] text-[#777]',
  REJECTED: 'bg-[#c81717] text-white',
  CONFIRMED: 'bg-[#62a56d] text-white',
};

const labels = {
  SUBMITTED: 'ĐÃ GỬI',
  PENDING: 'PENDING',
  REVIEWING: 'PENDING',
  REJECTED: 'REJECTED',
  CONFIRMED: 'CONFIRMED',
};

export default function ClaimStatusBadge({ status }) {
  return <span className={`inline-flex min-h-12 items-center rounded-full border border-[#237596] px-6 text-lg font-semibold ${styles[status] || 'bg-slate-200'}`}>{labels[status] || status}</span>;
}
