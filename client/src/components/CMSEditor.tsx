import React, { useEffect, useRef } from 'react';
import EditorJS, { EditorConfig } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import ImageTool from '@editorjs/image';
import Paragraph from '@editorjs/paragraph';

interface CMSEditorProps {
  data?: EditorConfig['data'];
  initialContent?: EditorConfig['data'];
  onSave: (content: EditorConfig['data']) => void;
}

export const CMSEditor = ({ data, initialContent, onSave }: CMSEditorProps) => {
  const editorInstanceRef = useRef<EditorJS | null>(null);
  const editorHolderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorHolderRef.current && !editorInstanceRef.current) {
      const editor = new EditorJS({
        holder: editorHolderRef.current,
        placeholder: 'Inizia a scrivere o scegli un template...',
        tools: {
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
          },
          header: { 
            class: Header, 
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            }
          },
          list: { 
            class: List, 
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          quote: { 
            class: Quote, 
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Inserisci citazione...',
              captionPlaceholder: 'Autore della citazione'
            }
          },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                uploadByFile(file: File) {
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      resolve({ success: 1, file: { url: event.target?.result as string } });
                    };
                    reader.readAsDataURL(file);
                  });
                },
                uploadByUrl(url: string) {
                  return Promise.resolve({ success: 1, file: { url: url } });
                },
              },
            },
          },
        },
        data: data || initialContent || {},
        async onChange(api) {
          const content = await api.saver.save();
          onSave(content);
        },
      });
      editorInstanceRef.current = editor;
    }

    return () => {
      if (editorInstanceRef.current?.destroy) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={editorHolderRef} className="bg-white prose prose-lg max-w-none border rounded-md p-4 min-h-[600px]" />;
};