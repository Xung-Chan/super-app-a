import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
    createCommentRequested, 
    getCommentsRequested, 
    getPostDetailRequested, 
    selectComments, 
    selectPost, 
    selectPostError, 
    selectPostLoading 
} from "../state/post.slice";

export const usePostDetailVM = (postId: string | number) => {
    const dispatch = useDispatch();

    const loading = useSelector(selectPostLoading);
    const error = useSelector(selectPostError);
    const listComment = useSelector(selectComments);
    const post = useSelector(selectPost);

    const numericPostId = Number(postId);

    const fetchCommentsAndDetail = useCallback(() => {
        if (!numericPostId) return;
        dispatch(getPostDetailRequested({ id: numericPostId }));
        dispatch(getCommentsRequested({ postId: numericPostId }));
    }, [dispatch, numericPostId]);

    useEffect(() => {
        fetchCommentsAndDetail();
    }, [fetchCommentsAndDetail]);

    const handleCreateComment = useCallback((body: string) => {
        if (!numericPostId) return;
        dispatch(createCommentRequested({
            postId: numericPostId,
            name: "User Me",
            email: "me@example.com",
            body,
        }));
    }, [dispatch, numericPostId]);

    return {
        listComment,
        loading,
        error,
        post,
        handleCreateComment,
        fetchComments: fetchCommentsAndDetail
    };
};