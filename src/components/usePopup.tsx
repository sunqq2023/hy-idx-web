import { closeSvg } from '@/assets'
import { Popup } from 'antd-mobile'
import classNames from 'classnames'
import React, { useState } from 'react'
import { PageLoading } from './PageLoading'

interface IPopupProps {
  title?: string | React.ReactNode
  content: React.ReactNode
  showCloseButton?: boolean
  onClose?: () => void
  contentClassName?: string
  closeButtonClassName?: string
  containerClassName?: string
  afterClose?: () => void
  showCloseRoundButton?: boolean
  initVisible?: boolean
  onMaskClick?: () => void
  className?: string
  titleClassName?: string
  fullscreen?: boolean
  customscreen?: boolean
  rightIcon?: React.ReactNode
  afterShow?: () => void
}

const usePopup = ({
  title,
  content,
  showCloseButton = true,
  onClose,
  contentClassName,
  containerClassName,
  closeButtonClassName,
  afterClose,
  showCloseRoundButton,
  initVisible = false,
  onMaskClick,
  titleClassName,
  fullscreen = false,
  customscreen = false,
  className,
  rightIcon,
  afterShow
}: IPopupProps) => {
  const [open, setOpen] = useState(initVisible)
  const [loading, setLoading] = useState(false)

  return {
    open,
    setOpen,
    component: (
      <Popup
        closeIcon={null}
        visible={open}
        showCloseButton={showCloseButton}
        onMaskClick={() => {
          setOpen(false)
          onMaskClick?.()
        }}
        onClose={() => {
          onClose && onClose()
          setOpen(false)
        }}
        afterClose={afterClose}
        className={`keyboard_foot ${className}`}
        bodyStyle={
          {
            //   borderTopLeftRadius: '16px',
            //   borderTopRightRadius: '16px'
            // minHeight: '40vh'
          }
        }
        afterShow={afterShow}
      >
        <div
          className={classNames(
            'flex size-full flex-col p-4 pt-0 ',
            [customscreen ? 'h-[calc(100vh-100px)]' : ''],
            [fullscreen ? 'h-[calc(100vh-var(--popup-top-space))]' : ''],
            containerClassName
          )}
        >
          {title ? (
            <div
              className={
                `relative flex-shrink-0 flex h-[--popup-title-height] items-center justify-center text-[16px] font-semibold leading-[18px]` +
                closeButtonClassName
              }
            >
              {showCloseButton && (
                <img
                  src={closeSvg}
                  className={`absolute left-0 w-[24px] cursor-pointer`}
                  onClick={() => {
                    setOpen(false)
                    onClose && onClose()
                  }}
                />
              )}
              {/* {showCloseRoundButton && (
                  <img
                    src={CloseRoundSvg}
                    className={`absolute right-0 w-[24px] cursor-pointer`}
                    onClick={() => {
                      setOpen(false)
                      onClose && onClose()
                    }}
                  />
                )} */}

              {rightIcon && (
                <div className={`absolute right-0 w-[24px] cursor-pointer`}>
                  {rightIcon}
                </div>
              )}

              <div
                className={
                  (showCloseButton ? ' ' : `w-full text-[#121212] `) +
                  titleClassName
                }
              >
                {title}
              </div>
            </div>
          ) : (
            <div
              className={
                `flex flex-shrink-0 h-[40px] items-center justify-end text-xl font-bold ` +
                closeButtonClassName
              }
            >
              <img
                src={closeSvg}
                className={`cursor-pointer`}
                onClick={() => {
                  setOpen(false)
                  onClose && onClose()
                }}
              />
            </div>
          )}
          <div
            className={classNames(
              'max-h-[calc(100%-var(--popup-title-height))] py-[20px] flex w-full flex-1 flex-col items-center justify-start  overflow-y-auto no-scrollbar',
              contentClassName
            )}
          >
            {/* {loading ? <PageLoading /> : open && content} */}
            {open && content}
          </div>
        </div>
      </Popup>
    )
  }
}

export default usePopup
