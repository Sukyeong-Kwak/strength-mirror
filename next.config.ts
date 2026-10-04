import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF 리포트가 서체 파일을 디스크에서 읽는다. import 하지 않는 파일이라
  // 배포 묶음에 저절로 들어가지 않으므로 두 경로에 붙여 넣는다
  outputFileTracingIncludes: {
    "/p/[id]/report": ["./src/lib/pdf/fonts/**/*"],
    "/results/report": ["./src/lib/pdf/fonts/**/*"],
  },
};

export default nextConfig;
