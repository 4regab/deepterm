import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFlashcard } from "@/context/FlashcardContextDefinition";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Book, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const FlashcardSavedList = () => {
  const { 
    savedDecks, 
    deleteFlashcardDeck, 
    loadDeck,
    handleCreateNewDeck,
  } = useFlashcard();
  
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  const handleDeleteClick = (deckId: string) => {
    setDeckToDelete(deckId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deckToDelete) {
      deleteFlashcardDeck(deckToDelete);
      setDeleteDialogOpen(false);
      setDeckToDelete(null);
    }
  };
  
  const handleStudyNow = (deckId: string) => {
    // First load the deck so it gets set as active and saved to local storage
    const deck = loadDeck(deckId);
    
    if (deck) {
      // Navigate directly to view mode using the new URL parameter system
      navigate("/study?viewing=flashcard");
    }
  };

  if (!savedDecks.length) {
    return (
      <div className="mt-10 text-center">
        <p className="text-lg font-medium px-6 py-4 bg-[#E5DEFF] inline-block border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          No flashcard decks yet. Create your first deck!
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="mt-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1A1F2C] flex items-center gap-2">
          <div className="bg-[#9b87f5] p-2 rounded-lg neo-border">
            <Book className="h-5 w-5 text-white" />
          </div>
          Your Flashcard Decks
        </h2>
        
        {/* Removed the "Create New Deck" button */}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedDecks.map((deck) => (
          <div 
            key={deck.id} 
            className="p-4 neo-border border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] bg-white rounded-lg transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-[#1A1F2C] line-clamp-1 mb-1 pr-2">
                {deck.title}
              </h3>
              <div className="flex items-center justify-center bg-[#E5DEFF] p-1 rounded-md min-w-[32px]">
                <span className="text-xs font-bold">{deck.cards.length}</span>
              </div>
            </div>
            
            <div className="flex items-center text-xs text-gray-500 mb-4">
              <Calendar className="h-3 w-3 mr-1" />
              <span className="mr-2">Created {formatDate(deck.dateCreated)}</span>
            </div>
            
            <Button 
              onClick={() => handleStudyNow(deck.id)}
              className="w-full bg-[#9b87f5] text-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              size="sm"
            >
              Study Now
            </Button>
            
            <div className="mt-2 flex justify-end">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(deck.id)}
                className="px-1 py-0 h-auto text-gray-500 hover:text-[#FF5C00] hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="neo-border shadow-neo bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard Deck</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flashcard deck? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-[#FF5C00] text-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FlashcardSavedList;
