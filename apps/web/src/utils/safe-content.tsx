import DOMPurify from 'dompurify';

export function SafeContent({ htmlContent }: { htmlContent: string }) {
    const sanitizedHtml = DOMPurify.sanitize(htmlContent);

    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}