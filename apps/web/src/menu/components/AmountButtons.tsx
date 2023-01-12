export interface AmountButtonsProps {
  amount: number
  onChange(amount: number): void
  minimum: number
}

export function AmountButtons(props: AmountButtonsProps) {
  const { amount, onChange, minimum } = props

  return (
    <div className="btn-group w-full rtl:flex-row-reverse bg-white">
      <button
        disabled={amount <= minimum}
        type="button"
        className="btn w-10"
        onClick={() => onChange(Math.max(0, amount - 1))}
      >
        -
      </button>
      <button type="button" className="btn grow pointer-events-none">
        {amount}
      </button>
      <button type="button" className="btn w-10" onClick={() => onChange(amount + 1)}>
        +
      </button>
    </div>
  )
}
