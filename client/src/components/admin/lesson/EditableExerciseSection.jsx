import ExercisesEditor from './ExercisesEditor';
import ExerciseItemListEditor from './ExerciseItemListEditor';

// Nội dung tab 练习 · Luyện tập: bài tập tĩnh (phonetics/chips/câu hỏi/đọc
// hiểu/bài tập về nhà/trích văn bản) đặt trong khung .ex-block giống các khối
// bài tập ở trang xem, cộng câu hỏi trắc nghiệm có chấm điểm (exerciseItems).
export default function EditableExerciseSection({ lesson, setField }) {
  const exerciseItems = lesson.exerciseItems || [];
  const quizItems = exerciseItems.filter((it) => it.kind !== 'flashcard');

  function setQuizItems(nextQuizItems) {
    const flashcards = exerciseItems.filter((it) => it.kind === 'flashcard');
    setField('exerciseItems', [...flashcards, ...nextQuizItems]);
  }

  return (
    <>
      <div className="ex-block">
        <h3>练习 · Nội dung luyện tập</h3>
        <ExercisesEditor exercises={lesson.exercises || {}} onChange={(v) => setField('exercises', v)} />
      </div>

      <h2 className="section-title">✅ Câu hỏi trắc nghiệm có chấm điểm</h2>
      <ExerciseItemListEditor items={quizItems} onChange={setQuizItems} />
    </>
  );
}
