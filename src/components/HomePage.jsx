import { useRef } from "react";
import HeroSection from "./HeroSection";
import Uploader from "./Uploader";

function HomePage() {
  const uploaderRef = useRef(null);

  const scrollToUploader = () => {
    uploaderRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <HeroSection onCtaClick={scrollToUploader} />

      <div ref={uploaderRef} style={{
        marginTop: "80px",        
       }}>
        <Uploader onFilesAdded={(files) => console.log(files)} />
      </div>
    </>
  );
}

export default HomePage;
