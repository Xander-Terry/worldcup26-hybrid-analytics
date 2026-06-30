export default function TestElectricCard() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      {/* Test card */}
      <div
        style={{
          width: 240,
          height: 140,
          border: "4px solid #00F0FF",
          filter: "url(#bl-electric-border)",
          borderRadius: 12,
          background: "#061428",
        }}
      />
    </div>
  )
}
