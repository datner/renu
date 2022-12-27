import { NumberInput, Group, ActionIcon, NumberInputHandlers } from "@mantine/core"
import { useRef } from "react"

type Props = {
  value: number
  onChange(next: number): void
  disabled: boolean
}

export function SmallAmountButtons(props: Props) {
  const { value, onChange, disabled } = props
  const handlers = useRef<NumberInputHandlers>()

  return (
    <Group spacing={5}>
      <ActionIcon size="xl" variant="default" onClick={() => handlers.current?.decrement()}>
        –
      </ActionIcon>

      <NumberInput
        hideControls
        readOnly
        value={value}
        onChange={onChange}
        handlersRef={handlers}
        min={0}
        step={1}
        styles={{ input: { width: 44, height: 44, textAlign: "center" } }}
      />

      <ActionIcon
        size="xl"
        disabled={disabled}
        variant="default"
        onClick={() => handlers.current?.increment()}
      >
        +
      </ActionIcon>
    </Group>
  )
}
