import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Users,
  Check,
  Utensils,
  AlertCircle,
  Edit2,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { ReceiptData, Participant, ReceiptItem, CURRENCIES } from '../types';
import { BillSummary, formatCurrency } from '../utils/calculator';
import { SAMPLE_RECEIPTS } from '../utils/sampleReceipts';

interface ReceiptBuilderProps {
  receipt: ReceiptData;
  participants: Participant[];
  summary: BillSummary;
  isDark?: boolean;
  onUpdateReceipt: (updated: ReceiptData) => void;
  onAddParticipant: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
  onToggleItemAssignment: (itemId: string, participantId: string) => void;
  onAssignItemToAll: (itemId: string) => void;
  onClearItemAssignment: (itemId: string) => void;
  onAddItem: (item: Omit<ReceiptItem, 'id'>) => void;
  onViewReceipt?: () => void;
}

export const ReceiptBuilder: React.FC<ReceiptBuilderProps> = ({
  receipt,
  participants,
  summary,
  isDark = false,
  onUpdateReceipt,
  onAddParticipant,
  onRemoveParticipant,
  onToggleItemAssignment,
  onAssignItemToAll,
  onClearItemAssignment,
  onAddItem,
  onViewReceipt,
}) => {
  // New Item Form State
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Editing Bill Title State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(receipt.billTitle);

  // New Participant Form State
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddPersonInput, setShowAddPersonInput] = useState(false);

  const activeCurrencyConfig = CURRENCIES[receipt.currency] || CURRENCIES.USD;
  const currencySymbol = activeCurrencyConfig.symbol;

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(itemPrice);
    if (!itemName.trim() || isNaN(price) || price <= 0) return;

    onAddItem({
      name: itemName.trim(),
      price: price * itemQuantity,
      quantity: itemQuantity,
      category: 'Purchased Item',
      assignedTo: selectedAssignees,
    });

    setItemName('');
    setItemPrice('');
    setItemQuantity(1);
    setSelectedAssignees([]);
  };

  const handleAddPersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      onAddParticipant(newPersonName.trim());
      setNewPersonName('');
      setShowAddPersonInput(false);
    }
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateReceipt({
        ...receipt,
        billTitle: titleInput.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = receipt.items.filter((item) => item.id !== itemId);
    const newTotal = updatedItems.reduce((acc, it) => acc + it.price, 0);
    onUpdateReceipt({
      ...receipt,
      items: updatedItems,
      total: newTotal,
    });
  };

  const toggleAssignee = (pId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleLoadDemo = () => {
    const demo = SAMPLE_RECEIPTS[0].data;
    onUpdateReceipt({
      ...demo,
      currency: receipt.currency,
    });
  };

  return (
    <div className="flex flex-col h-full ios-glass rounded-3xl p-4 sm:p-6 overflow-hidden transition-all shadow-xl">
      {/* Top Header: Editable Bill Title & Live Total */}
      <div
        className={`flex items-center justify-between pb-3.5 mb-3 border-b ${
          isDark ? 'border-[#2a2a34]' : 'border-sky-100'
        }`}
      >
        <div className="flex-1 min-w-0 pr-3">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="ios-input text-sm font-black px-3 py-1.5 rounded-xl w-full max-w-xs focus:outline-none"
              />
              <button
                onClick={handleSaveTitle}
                className="ios-btn-primary text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => {
                setTitleInput(receipt.billTitle);
                setIsEditingTitle(true);
              }}
            >
              <h2 className="text-lg font-black tracking-tight truncate">
                {receipt.billTitle}
              </h2>
              <Edit2
                className={`w-4 h-4 transition-colors shrink-0 ${
                  isDark
                    ? 'text-zinc-500 group-hover:text-sky-400'
                    : 'text-slate-400 group-hover:text-sky-600'
                }`}
              />
            </div>
          )}
          <p
            className={`text-xs font-bold mt-0.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            {receipt.items.length} item{receipt.items.length === 1 ? '' : 's'} • Tap title to rename
          </p>
        </div>

        <div className="text-right shrink-0">
          <span
            className={`text-[10px] font-black uppercase tracking-wider block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            Total Due ({receipt.currency})
          </span>
          <span className="font-mono text-lg sm:text-2xl font-black text-sky-500">
            {formatCurrency(summary.grandTotal, receipt.currency)}
          </span>
        </div>
      </div>

      {/* Diners Management Bar */}
      <div
        className={`mb-3.5 ios-glass-card rounded-2xl p-3 sm:p-4 border ${
          isDark ? 'border-[#2a2a34]' : 'border-sky-100'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-black flex items-center gap-2 tracking-wide">
            <Users className="w-4 h-4 text-sky-500" />
            <span>People Splitting ({participants.length})</span>
          </span>

          {!showAddPersonInput && (
            <button
              onClick={() => setShowAddPersonInput(true)}
              className="text-xs font-black text-sky-500 hover:text-sky-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Person</span>
            </button>
          )}
        </div>

        {/* Diners Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {participants.length === 0 && !showAddPersonInput && (
            <button
              onClick={() => setShowAddPersonInput(true)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border border-dashed transition-all cursor-pointer ${
                isDark
                  ? 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                  : 'border-sky-300 text-sky-700 hover:bg-sky-50'
              }`}
            >
              + Add diners splitting this bill
            </button>
          )}

          {participants.map((person) => (
            <div
              key={person.id}
              className={`flex items-center gap-2 pl-3 pr-2 py-1 rounded-full text-xs font-bold border shadow-sm transition-all ${
                isDark
                  ? 'bg-[#1e1e24] text-white border-[#2e2e38]'
                  : 'bg-white text-slate-800 border-sky-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20 shrink-0"
                style={{ backgroundColor: person.avatarColor }}
              />
              <span>{person.name}</span>
              <button
                onClick={() => onRemoveParticipant(person.id)}
                className="text-zinc-400 hover:text-rose-500 rounded-full p-0.5 ml-1 transition-colors cursor-pointer"
                title={`Remove ${person.name}`}
              >
                ×
              </button>
            </div>
          ))}

          {showAddPersonInput && (
            <form onSubmit={handleAddPersonSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Name"
                autoFocus
                className="ios-input text-xs font-bold px-3 py-1 rounded-full w-28 focus:outline-none"
              />
              <button
                type="submit"
                className="ios-btn-primary text-xs px-3 py-1 rounded-full font-black cursor-pointer shadow-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddPersonInput(false)}
                className="text-xs px-1.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Quick Add Purchased Item Form: Name, Price, People Splitting */}
      <form
        onSubmit={handleAddItemSubmit}
        className={`mb-3.5 ios-glass-card rounded-2xl p-3.5 border ${
          isDark ? 'border-[#2a2a34]' : 'border-sky-100'
        }`}
      >
        <span className="text-xs font-black mb-2.5 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-sky-500" />
          <span>Add Purchased Item</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2.5">
          {/* Name */}
          <div className="sm:col-span-6">
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item name (e.g. Avocado Toast)"
              className="w-full ios-input text-xs font-bold px-3 py-2.5 rounded-xl placeholder-zinc-500"
            />
          </div>

          {/* Price with active currency symbol */}
          <div className="sm:col-span-3 relative">
            <span
              className={`absolute left-3 top-2.5 text-xs font-black select-none pointer-events-none ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              {currencySymbol}
            </span>
            <input
              type="number"
              step={activeCurrencyConfig.decimals === 0 ? '1' : '0.01'}
              min={activeCurrencyConfig.decimals === 0 ? '1' : '0.01'}
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder={activeCurrencyConfig.decimals === 0 ? '0' : '0.00'}
              className={`w-full ios-input text-xs ${
                currencySymbol.length > 2 ? 'pl-12' : 'pl-7'
              } pr-2 py-2.5 rounded-xl font-mono font-black`}
            />
          </div>

          {/* Quantity Stepper */}
          <div
            className={`sm:col-span-3 flex items-center justify-between ios-input rounded-xl px-2.5 py-1.5`}
          >
            <button
              type="button"
              onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
              className="text-zinc-400 hover:text-sky-500 font-black px-2 py-0.5 cursor-pointer text-sm"
            >
              -
            </button>
            <span className="text-xs font-mono font-black">x{itemQuantity}</span>
            <button
              type="button"
              onClick={() => setItemQuantity((q) => q + 1)}
              className="text-zinc-400 hover:text-sky-500 font-black px-2 py-0.5 cursor-pointer text-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* People Splitting this item */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t mt-2 ${
            isDark ? 'border-[#2a2a34]' : 'border-sky-100/80'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {participants.length > 0 ? (
              <>
                <span
                  className={`text-[11px] font-black ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  Split with:
                </span>
                {participants.map((person) => {
                  const isSelected = selectedAssignees.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => toggleAssignee(person.id)}
                      className={`text-xs px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 scale-[1.02]'
                          : isDark
                          ? 'bg-[#1e1e24] text-zinc-300 hover:bg-[#282830] border border-[#2e2e38]'
                          : 'bg-white text-slate-700 border border-sky-100 hover:bg-sky-50'
                      }`}
                    >
                      <span>{person.name}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </>
            ) : (
              <span
                className={`text-[11px] font-semibold ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                Add diners above to assign this item
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!itemName.trim() || !itemPrice}
            className="ios-btn-primary px-4 py-2 rounded-xl text-xs font-black shrink-0 disabled:opacity-40 cursor-pointer shadow-md"
          >
            + Add to Bill
          </button>
        </div>
      </form>

      {/* Bill Items List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {summary.unassignedItemsCount > 0 && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center justify-between shadow-sm ${
              isDark
                ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                : 'bg-amber-50/90 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>
                  {summary.unassignedItemsCount} item
                  {summary.unassignedItemsCount > 1 ? 's' : ''} unassigned
                </strong>{' '}
                ({formatCurrency(summary.unassignedTotal, receipt.currency)})
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-500">
              Tap names to split
            </span>
          </div>
        )}

        {/* Empty state when no items are on the bill */}
        {receipt.items.length === 0 && (
          <div
            className={`p-8 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center my-6 ${
              isDark
                ? 'border-[#2e2e38] bg-[#18181e]/60 text-zinc-400'
                : 'border-sky-200 bg-sky-50/50 text-slate-500'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6 stroke-[2]" />
            </div>
            <h3
              className={`text-sm font-black mb-1 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Clean Bill • No Items Added
            </h3>
            <p className="text-xs max-w-sm mb-4 font-semibold">
              Add your purchased items, prices, and choose who split them using the form above.
            </p>
            <button
              onClick={handleLoadDemo}
              className="text-xs font-black text-sky-500 hover:text-sky-400 flex items-center gap-1.5 cursor-pointer bg-sky-500/10 px-3.5 py-1.5 rounded-xl transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load sample dinner items</span>
            </button>
          </div>
        )}

        {receipt.items.map((item) => {
          const assignedDiners = participants.filter((p) =>
            item.assignedTo.includes(p.id)
          );
          const isAssigned = assignedDiners.length > 0;
          const costEach = isAssigned ? item.price / assignedDiners.length : item.price;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl transition-all border ${
                isAssigned
                  ? isDark
                    ? 'bg-[#1e1e24] border-[#2e2e38] shadow-md'
                    : 'bg-white/95 border-sky-100 shadow-md'
                  : isDark
                  ? 'bg-amber-950/20 border-dashed border-amber-600/70'
                  : 'bg-amber-50/60 border-dashed border-amber-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-black text-sm sm:text-base tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.quantity > 1 && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-black ${
                          isDark
                            ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        x{item.quantity}
                      </span>
                    )}
                  </div>

                  {isAssigned && assignedDiners.length > 1 && (
                    <p className="text-xs text-sky-500 font-bold mt-0.5">
                      Split {assignedDiners.length} ways • {formatCurrency(costEach, receipt.currency)} each
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono font-black text-sm sm:text-lg">
                    {formatCurrency(item.price, receipt.currency)}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-xl transition-colors cursor-pointer"
                    title="Remove item"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* People Splitting Chips */}
              <div
                className={`pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 ${
                  isDark ? 'border-[#2a2a34]' : 'border-sky-50'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {participants.map((person) => {
                    const isPersonAssigned = item.assignedTo.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        onClick={() => onToggleItemAssignment(item.id, person.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                          isPersonAssigned
                            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                            : isDark
                            ? 'bg-[#18181e] text-zinc-300 border border-[#2e2e38] hover:bg-[#25252d]'
                            : 'bg-sky-50/90 text-slate-700 border border-sky-100 hover:bg-sky-100'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isPersonAssigned ? 'bg-white' : ''
                          }`}
                          style={{
                            backgroundColor: isPersonAssigned
                              ? '#ffffff'
                              : person.avatarColor,
                          }}
                        />
                        <span>{person.name}</span>
                        {isPersonAssigned && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2.5 text-xs font-black text-sky-500">
                  {participants.length > 1 && (
                    <button
                      onClick={() => onAssignItemToAll(item.id)}
                      className="hover:underline cursor-pointer"
                    >
                      Split All
                    </button>
                  )}
                  {isAssigned && (
                    <button
                      onClick={() => onClearItemAssignment(item.id)}
                      className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bill Summary Footer (Pure items sum, zero tax, zero tips) */}
      <div
        className={`pt-3.5 mt-2 border-t flex items-center justify-between ${
          isDark ? 'border-[#2a2a34]' : 'border-sky-100'
        }`}
      >
        <div>
          <span className="text-sm font-black block tracking-tight">Total Bill Due</span>
          <span
            className={`text-xs font-semibold ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            Pure item sum • Zero tax, zero tip
          </span>
        </div>
        <span className="font-mono text-xl sm:text-2xl font-black text-sky-500">
          {formatCurrency(summary.grandTotal, receipt.currency)}
        </span>
      </div>

      {onViewReceipt && (
        <button
          onClick={onViewReceipt}
          className="w-full mt-3 py-3 rounded-2xl ios-btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm font-black cursor-pointer shadow-md"
        >
          <Receipt className="w-4 h-4" />
          <span>View Receipt</span>
          <span className="font-mono opacity-85 font-bold">
            ({formatCurrency(summary.grandTotal, receipt.currency)})
          </span>
          <span className="text-base leading-none">→</span>
        </button>
      )}
    </div>
  );
};
