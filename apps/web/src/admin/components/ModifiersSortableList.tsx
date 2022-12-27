import { Badge, Card } from "@mantine/core"
import { ItemSchema } from "src/items/validations"
import * as O from "fp-ts/Option"
import * as A from "fp-ts/Array"
import { constNull, pipe } from "fp-ts/function"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { FieldArrayWithId } from "react-hook-form"
import {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  forwardRef,
  PropsWithChildren,
  Ref,
} from "react"
import { EllipsisVerticalIcon, PlusIcon } from "@heroicons/react/24/outline"
import { useStableO } from "fp-ts-react-stable-hooks"

type ModifierField = FieldArrayWithId<ItemSchema, "modifiers", "id">

type ModifierCardProps = {
  field: ModifierField
  onClick?(): void
  gripRef?: Ref<HTMLButtonElement>
  gripProps?: ComponentPropsWithoutRef<"button">
} & ComponentPropsWithRef<"div">

const ModifierCard = forwardRef<HTMLDivElement, ModifierCardProps>(
  ({ field, onClick, gripRef, gripProps = {}, ...rest }, ref) => {
    return (
      <Card ref={ref} {...rest} shadow="sm" radius="md" p={0} withBorder>
        <div className="flex flex-nowrap">
          <button
            type="button"
            ref={gripRef}
            {...gripProps}
            className="m-2 w-8 h-8 text-start grow-0 shrink-0 bg-gray-100 cursor-grab rounded-md border border-gray-200 flex items-center justify-center"
          >
            <div className="text-gray-600 w-5 h-5 flex rtl:flex-row-reverse">
              <EllipsisVerticalIcon />
              <EllipsisVerticalIcon className="-ml-3" />
            </div>
          </button>
          <button
            type="button"
            onClick={onClick}
            className="p-2 text-start active:bg-gray-100 flex grow w-56 justify-center items-center"
          >
            <div className="grow text-sm font-mono">
              {field.config.identifier || "New Modifier"}
            </div>
            <Badge color={field.config._tag === "oneOf" ? "pink" : "blue"}>
              {field.config._tag}
            </Badge>
          </button>
        </div>
      </Card>
    )
  }
)

type AddModifierCardProps = {
  onClick?(): void
}

const AddModifierCard = (props: AddModifierCardProps) => {
  const { onClick } = props
  return (
    <Card
      component="button"
      type="button"
      className="opacity-50 hover:opacity-100 hover:scale-105 transition-all"
      shadow="sm"
      radius="md"
      p={0}
      withBorder
      onClick={onClick}
    >
      <div className="flex flex-nowrap">
        <div className="m-2 w-8 h-8 text-start grow-0 shrink-0 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
          <div className="text-gray-600 w-5 h-5 flex">
            <PlusIcon />
          </div>
        </div>
        <div className="p-2 text-start flex grow w-56 justify-center items-center">
          <div className="grow text-sm font-mono">New Modifier</div>
          <Badge color="gray">???</Badge>
        </div>
      </div>
    </Card>
  )
}

const ListItem = ({ position, children }: PropsWithChildren<{ position?: number }>) => (
  <li className="flex items-center">
    <div className="text-center w-14 font-bold text-lg text-gray-400 tracking-widest">
      {position != null ? `${position + 1}.` : ""}
    </div>
    {children}
  </li>
)

const SortableModifierCard = (props: ModifierCardProps) => {
  const { field } = props
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
  }

  return (
    <ModifierCard
      ref={setNodeRef}
      gripRef={setActivatorNodeRef}
      gripProps={{ ...listeners, ...attributes }}
      {...props}
      style={style}
    />
  )
}

ModifierCard.displayName = "ModifierCard"

type Props = {
  fields: ModifierField[]
  move(from: number, to: number): void
  onClick(index: number): void
  onAddModifier(): void
}

export function ModifiersSortableList(props: Props) {
  const { fields, move, onClick, onAddModifier } = props
  const [draggedField, setDraggedField] = useStableO<ModifierField>(O.none)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) =>
    pipe(
      fields,
      A.findFirst((f) => f.id === event.active.id),
      setDraggedField
    )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setDraggedField(O.none)
    if (over && active.id !== over.id) {
      const from = pipe(
        fields,
        A.findIndex((f) => f.id === active.id),
        O.getOrElse(() => -1)
      )
      const to = pipe(
        fields,
        A.findIndex((f) => f.id === over.id),
        O.getOrElse(() => -1)
      )
      move(from, to)
      onClick(to)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext strategy={rectSortingStrategy} items={fields}>
        <ul className="flex flex-col gap-3">
          {pipe(
            fields,
            A.mapWithIndex((i, f) => (
              <ListItem key={f.id} position={i}>
                <SortableModifierCard field={f} onClick={() => onClick(i)} />
              </ListItem>
            ))
          )}
          <ListItem>
            <AddModifierCard onClick={onAddModifier} />
          </ListItem>
        </ul>
      </SortableContext>
      <DragOverlay>
        {pipe(
          draggedField,
          O.match(constNull, (field) => <ModifierCard field={field} />)
        )}
      </DragOverlay>
    </DndContext>
  )
}
