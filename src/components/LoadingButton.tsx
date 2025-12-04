import { Button } from 'antd-mobile'
import classNames from 'classnames'

const LoadingButton = ({
  onClick,
  isLoading,
  text,
  customClass,
  disabled
}: {
  onClick: () => void
  isLoading?: boolean
  text: string
  customClass?: string
  disabled?: boolean
}) => {
  return (
    <Button
      onClick={onClick}
      className={classNames(
        customClass,
        '!bg-black !rounded-3xl !text-white flex justify-center py-2 w-full'
      )}
      disabled={disabled}
      loading={isLoading}
    >
      {text}
    </Button>
  )
}

export default LoadingButton
