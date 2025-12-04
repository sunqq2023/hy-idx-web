import SwiperTabs from "@/components/SwiperTabs";
import { Home, MachineTx, Team } from "./components";
import { useEffect, useState } from "react";
import TopBarConnectButton from "@/components/TopBarConnectButton";
import { useNavigate } from "react-router-dom";
import { useBlacklist } from "@/hooks/useBlacklist";

const UserPage = () => {
  const [key, setKey] = useState(0);
  const [isStudio, setIsStudio] = useState(false);
  const [, setCanMarkStudio] = useState(false);

  const handleStudioStatusChange = (studioStatus: boolean) => {
    setIsStudio(studioStatus);
  };

  const handleStudioMarkerStatusChange = (markerStatus: boolean) => {
    setCanMarkStudio(markerStatus);
  };

  const tabs = [
    {
      title: "首页",
      children: (
        <Home
          onStudioStatusChange={handleStudioStatusChange}
          onStudioMarkerStatusChange={handleStudioMarkerStatusChange}
        />
      ),
    },
    {
      title: "矿机交易",
      children: <MachineTx isShow={key === 1} />,
    },
    {
      title: "团队",
      children: <Team />,
    },
  ];

  const getTabKey = (key: number) => {
    setKey(key);
  };

  const { isConnected, isBlacklisted } = useBlacklist();

  const navigate = useNavigate();

  const effectiveIsConnected = isConnected && !isBlacklisted;

  useEffect(() => {
    if (!effectiveIsConnected) {
      navigate("/");
    }
  }, [effectiveIsConnected, navigate]);

  return (
    <div className="pt-2 h-full overflow-hidden relative">
      <SwiperTabs
        tabs={tabs}
        customClassName=""
        getTabKey={getTabKey}
        defaultKey={0}
        titleFontSize="1rem"
      />
      <div className="absolute top-[1.25rem] right-[1.25rem]">
        <TopBarConnectButton isStudio={isStudio} />
      </div>
    </div>
  );
};

export default UserPage;
