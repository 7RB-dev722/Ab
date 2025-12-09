import React from 'react';
import { Save, Link as LinkIcon, Type, Layout, MessageSquare, Phone, Globe } from 'lucide-react';

interface SiteContentEditorProps {
  settings: Record<string, string>;
  onSettingsChange: (settings: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

const SectionWrapper: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg animate-fade-in-up">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
            <Icon className="w-6 h-6 text-cyan-400" />
            <span>{title}</span>
        </h3>
        <div className="space-y-6">{children}</div>
    </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string; icon?: React.ElementType }> = ({ label, value, onChange, placeholder, type = "text", icon: Icon }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-gray-400" />}
            {label}
        </label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
        />
    </div>
);

const TextAreaField: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; rows?: number }> = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
        />
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700">
        <span className="text-gray-300 font-medium">{label}</span>
        <button onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${enabled ? 'bg-cyan-600' : 'bg-slate-600'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const SiteContentEditor: React.FC<SiteContentEditorProps> = ({ settings, onSettingsChange, onSave, saving }) => {
    
    const updateSetting = (key: string, value: string) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <SectionWrapper title="General Information" icon={Globe}>
                <InputField label="Site Name" value={settings.site_name} onChange={(v) => updateSetting('site_name', v)} placeholder="Cheatloop" />
                <InputField label="Logo URL" value={settings.site_logo_url} onChange={(v) => updateSetting('site_logo_url', v)} placeholder="/cheatloop copy.png" />
                <InputField label="Favicon URL" value={settings.site_favicon_url} onChange={(v) => updateSetting('site_favicon_url', v)} placeholder="/cheatloop copy.png" />
                <TextAreaField label="Footer Copyright" value={settings.footer_copyright} onChange={(v) => updateSetting('footer_copyright', v)} />
            </SectionWrapper>

            <SectionWrapper title="Hero Section" icon={Layout}>
                <InputField label="Hero Title" value={settings.hero_title} onChange={(v) => updateSetting('hero_title', v)} />
                <TextAreaField label="Hero Subtitle" value={settings.hero_subtitle} onChange={(v) => updateSetting('hero_subtitle', v)} />
            </SectionWrapper>

            <SectionWrapper title="Features Section" icon={Type}>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                        <h4 className="text-cyan-400 font-bold">Feature 1</h4>
                        <InputField label="Title" value={settings.feature_1_title} onChange={(v) => updateSetting('feature_1_title', v)} />
                        <InputField label="Description" value={settings.feature_1_desc} onChange={(v) => updateSetting('feature_1_desc', v)} />
                    </div>
                    <div className="space-y-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                        <h4 className="text-purple-400 font-bold">Feature 2</h4>
                        <InputField label="Title" value={settings.feature_2_title} onChange={(v) => updateSetting('feature_2_title', v)} />
                        <InputField label="Description" value={settings.feature_2_desc} onChange={(v) => updateSetting('feature_2_desc', v)} />
                    </div>
                    <div className="space-y-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                        <h4 className="text-green-400 font-bold">Feature 3</h4>
                        <InputField label="Title" value={settings.feature_3_title} onChange={(v) => updateSetting('feature_3_title', v)} />
                        <InputField label="Description" value={settings.feature_3_desc} onChange={(v) => updateSetting('feature_3_desc', v)} />
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper title="Social Links" icon={LinkIcon}>
                <div className="grid md:grid-cols-2 gap-6">
                    <InputField label="Discord URL" value={settings.discord_url} onChange={(v) => updateSetting('discord_url', v)} icon={MessageSquare} />
                    <InputField label="WhatsApp URL" value={settings.whatsapp_url} onChange={(v) => updateSetting('whatsapp_url', v)} icon={Phone} />
                    <InputField label="Telegram URL" value={settings.telegram_url} onChange={(v) => updateSetting('telegram_url', v)} icon={MessageSquare} />
                    <InputField label="Telegram Purchase URL" value={settings.telegram_purchase_url} onChange={(v) => updateSetting('telegram_purchase_url', v)} icon={MessageSquare} />
                </div>
            </SectionWrapper>

            <SectionWrapper title="Display Options" icon={Layout}>
                <ToggleSwitch label="Show WhatsApp Buttons" enabled={settings.show_all_whatsapp_buttons !== 'false'} onChange={(e) => updateSetting('show_all_whatsapp_buttons', String(e))} />
                <ToggleSwitch label="Show Telegram Buttons" enabled={settings.show_telegram_button !== 'false'} onChange={(e) => updateSetting('show_telegram_button', String(e))} />
                <ToggleSwitch label="Show 'I Have Paid' Button" enabled={settings.show_i_have_paid_button !== 'false'} onChange={(e) => updateSetting('show_i_have_paid_button', String(e))} />
            </SectionWrapper>

            <div className="fixed bottom-6 right-6 z-50">
                <button 
                    onClick={onSave} 
                    disabled={saving} 
                    className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-2xl shadow-cyan-500/20 font-bold text-lg transform hover:scale-105"
                >
                    <Save className="w-6 h-6" />
                    <span>{saving ? 'Saving Changes...' : 'Save All Changes'}</span>
                </button>
            </div>
        </div>
    );
};

export default SiteContentEditor;
