import { ErrorBlock } from 'antd-mobile'

const EmptyComp = () => {
  return (
    <ErrorBlock
      status="empty"
      title="暂无数据"
      description=""
      className="flex flex-col items-center"
    />
  )
}

export default EmptyComp
