import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from './card';
import { ArrowLeft, Star, Send, Edit, Trash2, User, AlertCircle, ThumbsUp, MessageSquare, Clock, Shield } from 'lucide-react';
import { api } from '../../utils/api';  

const ProductCommentsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [userComment, setUserComment] = useState(null);
  const [sortBy, setSortBy] = useState('recent');

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProductImage = (product) => {
    if (product?.product_photo) {
      if (typeof product.product_photo === 'string') {
        return product.product_photo;
      }
      if (Array.isArray(product.product_photo) && product.product_photo.length > 0) {
        return product.product_photo[0];
      }
    }
    return '/sample1.jpg';
  };

  const calculateAverageRating = () => {
    if (comments.length === 0) return 0;
    const total = comments.reduce((sum, comment) => sum + comment.rating, 0);
    return (total / comments.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    comments.forEach(comment => {
      distribution[comment.rating]++;
    });
    return distribution;
  };

  useEffect(() => {
    fetchProductAndComments();
  }, [productId]);

  const fetchProductAndComments = async () => {
    try {
      setLoading(true);
      
      const productResult = await api.getProduct(productId);
      if (productResult.error) {
        throw new Error(productResult.error);
      }
      setProduct(productResult.data);

      const commentsResult = await api.getProductComments(productId);
      if (commentsResult.error) {
        throw new Error(commentsResult.error);
      }

      let commentsData = commentsResult.data;
      if (commentsData && commentsData.results) {
        commentsData = commentsData.results;
      } else if (!Array.isArray(commentsData)) {
        commentsData = [];
      }

      let sortedComments = [...commentsData];
      switch (sortBy) {
        case 'recent':
          sortedComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        case 'helpful':
          sortedComments.sort((a, b) => (b.helpful_votes || 0) - (a.helpful_votes || 0));
          break;
        case 'highest':
          sortedComments.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowest':
          sortedComments.sort((a, b) => a.rating - b.rating);
          break;
      }
      
      setComments(sortedComments);
      
      const userComment = sortedComments.find(comment => comment.is_own_comment);
      setUserComment(userComment);
      if (userComment) {
        setNewComment('');
        setRating(userComment.rating);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load product and comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert('Please write a comment');
      return;
    }

    try {
      const result = await api.addComment(productId, {
        rating: rating,
        comment: newComment.trim(),
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      const newCommentData = result.data;
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
      setUserComment(newCommentData);
      alert('Comment submitted successfully!');
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleUpdateComment = async () => {
    if (!editText.trim() || !editingCommentId) return;

    try {
      const result = await api.updateComment(editingCommentId, {
        comment: editText.trim(),
        rating: rating,
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      const updatedComment = result.data;
      setComments(prev =>
        prev.map(comment =>
          comment.id === editingCommentId ? updatedComment : comment
        )
      );
      setUserComment(updatedComment);
      setEditingCommentId(null);
      setEditText('');
      alert('Comment updated successfully!');
    } catch (err) {
      console.error('Error updating comment:', err);
      alert('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const result = await api.deleteComment(commentId);

      if (result.error) {
        alert(result.error);
        return;
      }

      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setUserComment(null);
      setEditingCommentId(null);
      alert('Comment deleted successfully!');
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  const handleMarkHelpful = async (commentId) => {
    try {
      const result = await api.markHelpful(commentId);

      if (result.error) {
        console.warn('Mark helpful failed:', result.error);
        return;
      }

      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                helpful_votes: (comment.helpful_votes || 0) + 1,
                user_voted_helpful: true,
              }
            : comment
        )
      );
    } catch (err) {
      console.error('Error marking helpful:', err);
    }
  };

  useEffect(() => {
    if (comments.length > 0) {
      let sorted = [...comments];
      switch (sortBy) {
        case 'recent':
          sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        case 'helpful':
          sorted.sort((a, b) => (b.helpful_votes || 0) - (a.helpful_votes || 0));
          break;
        case 'highest':
          sorted.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowest':
          sorted.sort((a, b) => a.rating - b.rating);
          break;
      }
      setComments(sorted);
    }
  }, [sortBy]);

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.comment);
    setRating(comment.rating);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditText('');
    if (userComment) {
      setRating(userComment.rating);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const ratingDistribution = getRatingDistribution();
  const averageRating = calculateAverageRating();
  const totalComments = comments.length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <p className="text-[23px] font-bold text-black">Product Reviews</p>
        </div>
      </div>

      {product && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <div className="w-20 h-20 flex-shrink-0 mr-4 mb-4 md:mb-0">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-black mb-1">
                  {product.name}
                </h2>
                <p className="text-gray-600 text-sm mb-2">
                  {product.description?.substring(0, 100)}...
                </p>
                <div className="flex items-center">
                  <div className="flex items-center mr-4">
                    <div className="flex mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= averageRating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{averageRating}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({totalComments} reviews)
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(product.unit_price)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-black mb-4">Rating Summary</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star];
                  const percentage = totalComments > 0 ? (count / totalComments) * 100 : 0;
                  
                  return (
                    <div key={star} className="flex items-center">
                      <div className="flex items-center w-16">
                        <span className="text-sm text-gray-600 w-4">{star}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 ml-1" />
                      </div>
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 w-10 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-black mb-1">
                    {averageRating}
                  </div>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= averageRating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Based on {totalComments} review{totalComments !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-black mb-4">
                {userComment ? 'Your Review' : 'Write a Review'}
              </h3>
              
              {userComment && !editingCommentId ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= userComment.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(userComment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{userComment.comment}</p>

                </div>
              ) : (
                <form onSubmit={editingCommentId ? handleUpdateComment : handleSubmitComment}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={editingCommentId ? editText : newComment}
                      onChange={(e) =>
                        editingCommentId
                          ? setEditText(e.target.value)
                          : setNewComment(e.target.value)
                      }
                      placeholder="Share your experience with this product..."
                      className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                      rows="4"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {editingCommentId ? 'Update Review' : 'Submit Review'}
                    </button>
                    {editingCommentId && (
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black mb-2 md:mb-0">
              Customer Reviews ({totalComments})
            </h2>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 text-black rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="helpful">Most Helpful</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          {comments.length > 0 ? (
            <div className="space-y-2">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          {comment.user_photo ? (
                            <img
                              src={comment.user_photo}
                              alt={comment.user_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-black">
                            {comment.user_name}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <div className="flex mr-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= comment.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{formatDate(comment.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {comment.is_own_comment && !editingCommentId && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(comment)}
                            className="p-1 text-gray-400 hover:text-blue-500"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 mb-1">{comment.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Reviews Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to share your thoughts about this product!
                </p>
                <button
                  onClick={() => document.querySelector('textarea')?.focus()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Write a Review
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCommentsPage;