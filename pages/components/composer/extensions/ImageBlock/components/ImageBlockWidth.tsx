import { Slider } from '#root/pages/components/slider/slider.jsx'
import { memo, useCallback, useEffect, useState } from 'react'

export type ImageBlockWidthProps = {
  onChange: (value: number) => void
  value: number
}

export const ImageBlockWidth = memo(({ onChange, value }: ImageBlockWidthProps) => {
  const [currentValue, setCurrentValue] = useState(value)

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number.parseInt(e.target.value)
      onChange(nextValue)
      setCurrentValue(nextValue)
    },
    [onChange],
  )

  return (
    <div className="h-6 flex items-center px-1">
      <Slider
        min={0}
        max={100}
        className=" min-w-48"
        value={[currentValue]}
        onValueChange={(changedValue) => onChange?.(changedValue?.[0])}
      />
    </div>
  )

  // Commented out unreachable code
  // return (
  //   <div className="flex items-center gap-2">
  //     <input
  //       className="h-2 bg-neutral-200 border-0 rounded appearance-none fill-neutral-300"
  //       type="range"
  //       min="25"
  //       max="100"
  //       step="25"
  //       onChange={handleChange}
  //       value={currentValue}
  //     />
  //     <span className="text-xs font-semibold text-neutral-500 select-none">{value}%</span>
  //   </div>
  // )
})

ImageBlockWidth.displayName = 'ImageBlockWidth'
