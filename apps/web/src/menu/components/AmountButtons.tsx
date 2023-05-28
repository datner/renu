export interface AmountButtonsProps {
  amount: number;
  onIncrement(): void;
  onDecrement(): void;
  minimum: number;
}

export function AmountButtons(props: AmountButtonsProps) {
  const { amount, minimum, onDecrement, onIncrement } = props;

  return (
    <div className="btn-group w-full rtl:flex-row-reverse">
      <button disabled={amount <= minimum} type="button" className="btn w-10" onClick={onDecrement}>
        -
      </button>
      <button type="button" className="btn grow pointer-events-none">
        {amount}
      </button>
      <button type="button" className="btn w-10" onClick={onIncrement}>
        +
      </button>
    </div>
  );
}
