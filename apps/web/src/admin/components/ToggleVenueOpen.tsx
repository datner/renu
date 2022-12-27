import { LoadingOverlay, Switch } from "@mantine/core"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useState } from "react"
import Confetti from "react-confetti"
import changeVenueState from "src/venues/mutations/changeVenueState"
import getVenueOpen from "src/venues/queries/getVenueOpen"

export function ToggleVenueOpen() {
  const [venueState, { setQueryData }] = useQuery(getVenueOpen, {})
  const [confetti, setConfetti] = useState(false)
  const [change, { isLoading }] = useMutation(changeVenueState, {
    onSuccess({ open }) {
      setQueryData({ open })
      if (open) {
        setConfetti(true)
      }
    },
  })

  return (
    <>
      {confetti && (
        <Confetti
          recycle={false}
          numberOfPieces={2_000}
          onConfettiComplete={() => setConfetti(false)}
        />
      )}
      <div className="relative">
        <LoadingOverlay visible={isLoading} />
        <Switch
          checked={venueState.open}
          size="xl"
          onLabel="YES"
          offLabel="NO"
          label="Renu Accepting orders?"
          onChange={() => change({ open: !venueState.open })}
        />
      </div>
    </>
  )
}
