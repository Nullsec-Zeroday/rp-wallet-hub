export const NumberPad = ({ onNumberPress, onDelete }: { onNumberPress: (n: string) => void, onDelete: () => void }) => {
  const buttons = [
    { num: '1', letters: '' },
    { num: '2', letters: 'A B C' },
    { num: '3', letters: 'D E F' },
    { num: '4', letters: 'G H I' },
    { num: '5', letters: 'J K L' },
    { num: '6', letters: 'M N O' },
    { num: '7', letters: 'P Q R S' },
    { num: '8', letters: 'T U V' },
    { num: '9', letters: 'W X Y Z' },
    { num: '.', letters: '' },
    { num: '0', letters: '' },
    { num: 'del', letters: '' }
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#1a1a1a] w-full pb-8 pt-1.5">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={() => btn.num === 'del' ? onDelete() : onNumberPress(btn.num)}
          className="flex flex-col items-center justify-center bg-[#4a4a4a] active:bg-[#5a5a5a] rounded-md h-[46px]"
        >
          {btn.num === 'del' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
              <line x1="18" y1="9" x2="12" y2="15"></line>
              <line x1="12" y1="9" x2="18" y2="15"></line>
            </svg>
          ) : (
            <>
              <span className="text-[22px] leading-6 font-normal text-white">{btn.num}</span>
              {btn.letters && <span className="text-[9px] leading-3 font-bold text-[#aaaaaa] tracking-widest">{btn.letters}</span>}
            </>
          )}
        </button>
      ))}
    </div>
  );
};
