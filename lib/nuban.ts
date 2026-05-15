const BANK_CODE_WEIGHTS = [3, 7, 3, 3, 7, 3];
const SERIAL_WEIGHTS = [3, 7, 3, 3, 7, 3, 3, 7, 3];

function padBankCode(code: string): string {
  if (code.length === 3) return `000${code}`;
  if (code.length === 5) return `9${code}`;
  return code;
}

function computeCheckDigit(bankCode: string, serialNumber: string): number {
  const padded = padBankCode(bankCode);
  const bankSum = padded
    .split("")
    .reduce((s, d, i) => s + Number(d) * BANK_CODE_WEIGHTS[i], 0);
  const serialSum = serialNumber
    .split("")
    .reduce((s, d, i) => s + Number(d) * SERIAL_WEIGHTS[i], 0);
  const remainder = (bankSum + serialSum) % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

export function findMatchingBanks(
  accountNumber: string,
  banks: { name: string; code: string }[],
): { name: string; code: string }[] {
  if (accountNumber.length !== 10) return banks;
  const raw = accountNumber.replace(/\D/g, "");
  if (raw.length !== 10) return banks;

  const serial = raw.slice(0, 9);
  const checkDigit = Number(raw[9]);

  return banks.filter((bank) => {
    try {
      return computeCheckDigit(bank.code, serial) === checkDigit;
    } catch {
      return false;
    }
  });
}
