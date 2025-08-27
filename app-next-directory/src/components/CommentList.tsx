
export default function CommentList({ comments }: Readonly<{ comments: any[] }>) {
  return (
    <div className="space-y-8">
      {comments.map((comment) => (
        <div key={String(comment._id)} className="p-6 bg-white border-4 border-black rounded-lg shadow-lg">
          <p className="text-gray-800">{comment.content}</p>
          <p className="text-sm text-gray-500 mt-4">- {comment.user?.name || 'Anonymous'}</p>
        </div>
      ))}
    </div>
  );
}
