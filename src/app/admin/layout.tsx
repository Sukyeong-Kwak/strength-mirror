type AdminLayoutProps = {
  children: React.ReactNode;
};

// 셸(로그인 정보·로그아웃)은 각 화면이 AdminShell 로 직접 그린다.
// 로그인 화면과 콜백은 셸이 없어야 하는데 레이아웃은 경로를 알 수 없기 때문이다.
export default function AdminLayout({ children }: AdminLayoutProps) {
  return <div className="min-h-full">{children}</div>;
}
