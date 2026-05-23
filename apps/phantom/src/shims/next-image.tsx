import React from "react";

type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};

const NextImage = React.forwardRef<HTMLImageElement, NextImageProps>(function NextImage(
  { alt, fill, sizes: _sizes, priority: _priority, style, ...props },
  ref,
) {
  return (
    <img
      {...props}
      alt={alt ?? ""}
      ref={ref}
      style={
        fill
          ? {
              height: "100%",
              inset: 0,
              objectFit: "cover",
              position: "absolute",
              width: "100%",
              ...style,
            }
          : style
      }
    />
  );
});

export default NextImage;
