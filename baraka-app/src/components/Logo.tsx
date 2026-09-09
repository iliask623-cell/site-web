export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/icons/icon-192.png"
      width={size}
      height={size}
      alt="Baraka"
      className="rounded-xl"
    />
  )
}
