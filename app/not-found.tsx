export default function NotFound(){
  return (
    <div className ="flex flex-col items-center justify-center min-h-[400px] gap-2">
      <h2 className="text-x1 font-semibold"> 404 - Page Not Found</h2> 
      <p className="text-muted-foreground text-sm">
        This page does not exist.
      </p>
    </div>
  )
}