import { Dialog, Transition } from "@headlessui/react"
import { Fragment, PropsWithChildren } from "react"
import { NiceModalHandler } from "@ebay/nice-modal-react"

type Props = {
  show?: boolean
  onClose(): void
  afterLeave?(): void
}

export const renuModal = (modal: NiceModalHandler): Props => ({
  show: modal.visible,
  onClose: modal.hide,
  afterLeave: modal.remove,
})

export const Modal = (props: PropsWithChildren<Props>) => {
  const { children, show, onClose, afterLeave } = props

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={afterLeave}
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full bg-white max-w-md transform text-left rtl:text-right overflow-hidden rounded-2xl shadow-xl transition-all">
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
