import AIAssistant from '../components/AIAssistant';

export default function EmbedBlueAgent() {
    return (
        <div className="w-full h-screen bg-[#030712] overflow-hidden">
            <AIAssistant isEmbedded={true} />
        </div>
    );
}
