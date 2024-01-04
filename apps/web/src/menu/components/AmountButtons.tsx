export interface AmountButtonsProps {
  amount: number;
  onIncrement(): void;
  onDecrement(): void;
  minimum: number;
}

export function AmountButtons(props: AmountButtonsProps) {
  const { amount, minimum, onDecrement, onIncrement } = props;

  return (
    <div className="join w-full">
      <button disabled={amount <= minimum} type="button" className="btn join-item w-10" onClick={onDecrement}>
        -
      </button>
      <button type="button" className="btn join-item grow pointer-events-none">
        {amount}
      </button>
      <button type="button" className="btn join-item w-10" onClick={onIncrement}>
        +
      </button>
    </div>
  );
}
