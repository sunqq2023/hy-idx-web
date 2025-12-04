export const PageLoading = () => {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '90vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{ fontSize: 20, color: '#000', marginTop: 10 }}
          className="animate-bounce"
        >
          Loading...
        </div>
      </div>
    </div>
  )
}
