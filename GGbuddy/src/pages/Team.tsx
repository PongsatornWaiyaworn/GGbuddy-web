import Sidebar from "@/components/Sidebar";

const teamMembers = [
  {
    name: "โอม (นฤพนธ์ ฉายสุวรรณคีรี)",
    role: "Frontend Developer",
    image: "../../public/ohm.png",
    contact: {
      instagram: "https://www.instagram.com/aguywhocantswim/",
      facebook: "https://web.facebook.com/narupon.chaizuwankeeree?locale=th_TH",
    },
  },
  {
    name: "ตี๋ (พงศธร ไวยวรณ์)",
    role: "Backend Developer",
    image: "../../public/tee.png",
    contact: {
      instagram: "https://www.instagram.com/torn_txe/",
      facebook: "https://web.facebook.com/pongsatorn.pongsatornn?locale=th_TH",
    },
  },
];

const Team = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1e1e2f] via-[#10101a] to-black text-white">
      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-6 md:p-12 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-center mb-6 drop-shadow-lg text-white">
            ทีมผู้พัฒนา GGbuddy
          </h1>
          <p className="text-gray-300 text-center mb-10 text-base md:text-lg leading-relaxed">
            พวกเราคือนักพัฒนารุ่นใหม่ที่หลงใหลในการสร้างประสบการณ์เกมที่เชื่อมโยงผู้คนและเสริมสร้างมิตรภาพใหม่ ๆ ผ่านโลกดิจิทัล
          </p>

          <div className="flex flex-col gap-10">
          {teamMembers.map((member, index) => (
            <div
                key={index}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left"
            >
                <img
                src={member.image}
                alt={member.name}
                className="w-36 h-36 sm:w-[22vh] sm:h-[26vh] object-cover rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="text-2xl font-semibold break-words">{member.name}</h3>
                <p className="text-orange-400 font-medium mb-2">{member.role}</p>
                <div className="flex justify-center sm:justify-start gap-4 text-sm text-gray-400">
                    <a
                    href={member.contact.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-500 transition-colors"
                    >
                        Instagram
                    </a>
                    <a
                    href={member.contact.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                    >
                        Facebook
                    </a>
                </div>
                </div>
            </div>
            ))}

          </div>
        </main>
      </div>

      <footer className="bg-black/60 text-gray-400 text-sm text-center py-6 border-t border-white/10 mt-auto">
        <p>© {new Date().getFullYear()} GGbuddy. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Team;
