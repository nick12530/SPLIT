import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Users,
  Check,
  AlertCircle,
  Edit2,
  FileText,
  Sparkles,
  ShoppingBag,
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

  // Focus Refs for seamless keyboard data-entry
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const priceInputRef = React.useRef<HTMLInputElement>(null);

  // Participant Focus Lens State (hovering highlights all items assigned to them)
  const [highlightedParticipantId, setHighlightedParticipantId] = useState<string | null>(null);

  // Editing Item Inline State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

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
    nameInputRef.current?.focus();
  };

  const handleStartEditItem = (item: ReceiptItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
  };

  const handleSaveEditItem = (itemId: string) => {
    const price = parseFloat(editPrice);
    if (!editName.trim() || isNaN(price) || price <= 0) {
      setEditingItemId(null);
      return;
    }

    const updatedItems = receipt.items.map((it) =>
      it.id === itemId ? { ...it, name: editName.trim(), price } : it
    );
    const newTotal = updatedItems.reduce((acc, it) => acc + it.price, 0);
    onUpdateReceipt({
      ...receipt,
      items: updatedItems,
      total: newTotal,
    });
    setEditingItemId(null);
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
    <div className="flex flex-col h-full ios-glass rounded-2xl p-4 sm:p-5 transition-all">
      {/* Top Header: Editable Bill Title & Live Total */}
      <div
        className={`flex items-center justify-between pb-3.5 mb-3.5 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
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
                className="ios-input text-sm font-bold px-3 py-1.5 rounded-lg w-full max-w-xs focus:outline-none"
              />
              <button
                onClick={handleSaveTitle}
                className="ios-btn-primary text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
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
              <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
                {receipt.billTitle}
              </h2>
              <Edit2
                className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                  isDark
                    ? 'text-zinc-500 group-hover:text-zinc-300'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
            </div>
          )}
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            {receipt.items.length} item{receipt.items.length === 1 ? '' : 's'} · {receipt.date}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            Total Due
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-sky-500">
            {formatCurrency(summary.grandTotal, receipt.currency)}
          </span>
        </div>
      </div>

      {/* Diners Management Bar */}
      <div
        className={`mb-3.5 ios-glass-card rounded-xl p-3 sm:p-4 border ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold flex items-center gap-1.5 text-sky-500">
            <Users className="w-3.5 h-3.5" />
            <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>
              Participants ({participants.length})
            </span>
          </span>

          {!showAddPersonInput && (
            <button
              onClick={() => setShowAddPersonInput(true)}
              className="text-xs font-semibold text-sky-500 hover:text-sky-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Person</span>
            </button>
          )}
        </div>

        {/* Diners Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {participants.length === 0 && !showAddPersonInput && (
            <button
              onClick={() => setShowAddPersonInput(true)}
              className={`text-xs px-3 py-1.5 rounded-lg border border-dashed transition-all cursor-pointer ${
                isDark
                  ? 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              + Add people splitting this bill
            </button>
          )}

          {participants.map((person) => {
            const isHovered = highlightedParticipantId === person.id;
            return (
              <div
                key={person.id}
                onMouseEnter={() => setHighlightedParticipantId(person.id)}
                onMouseLeave={() => setHighlightedParticipantId(null)}
                className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-default select-none ${
                  isHovered
                    ? 'ring-2 ring-sky-500 bg-sky-500/10 text-white border-sky-500/30'
                    : isDark
                    ? 'bg-[#181920] text-zinc-200 border-white/[0.09] hover:border-white/20'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
                title="Hover to highlight this person's shared items"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: person.avatarColor }}
                />
                <span>{person.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (highlightedParticipantId === person.id) setHighlightedParticipantId(null);
                    onRemoveParticipant(person.id);
                  }}
                  className="text-zinc-400 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors text-sm leading-none"
                  title={`Remove ${person.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}

          {showAddPersonInput && (
            <form onSubmit={handleAddPersonSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Name"
                autoFocus
                className="ios-input text-xs font-medium px-2.5 py-1 rounded-lg w-28 focus:outline-none"
              />
              <button
                type="submit"
                className="ios-btn-primary text-xs px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddPersonInput(false)}
                className="text-xs px-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
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
        className={`mb-3.5 ios-glass-card rounded-xl p-3.5 border ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold flex items-center gap-1.5 text-sky-500">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>
              Add Bill Item
            </span>
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
            Press Enter ↵ to advance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2.5">
          {/* Name */}
          <div className="sm:col-span-6">
            <input
              ref={nameInputRef}
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  priceInputRef.current?.focus();
                }
              }}
              placeholder="Item name (e.g. Margherita Pizza)"
              className="w-full ios-input text-xs font-medium px-3 py-2 rounded-lg"
            />
          </div>

          {/* Price with active currency symbol */}
          <div className="sm:col-span-3 relative">
            <span
              className={`absolute left-2.5 top-2 text-xs font-bold select-none pointer-events-none ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              {currencySymbol}
            </span>
            <input
              ref={priceInputRef}
              type="number"
              step={activeCurrencyConfig.decimals === 0 ? '1' : '0.01'}
              min={activeCurrencyConfig.decimals === 0 ? '1' : '0.01'}
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder={activeCurrencyConfig.decimals === 0 ? '0' : '0.00'}
              className={`w-full ios-input text-xs ${
                currencySymbol.length > 2 ? 'pl-11' : 'pl-6'
              } pr-2 py-2 rounded-lg font-mono font-semibold`}
            />
          </div>

          {/* Quantity Stepper */}
          <div
            className={`sm:col-span-3 flex items-center justify-between ios-input rounded-lg px-2 py-1.5`}
          >
            <button
              type="button"
              onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
              className="text-zinc-400 hover:text-sky-500 font-bold px-1.5 py-0.5 cursor-pointer text-xs"
            >
              -
            </button>
            <span className="text-xs font-mono font-semibold">Qty {itemQuantity}</span>
            <button
              type="button"
              onClick={() => setItemQuantity((q) => q + 1)}
              className="text-zinc-400 hover:text-sky-500 font-bold px-1.5 py-0.5 cursor-pointer text-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* People Splitting this item */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t ${
            isDark ? 'border-white/[0.08]' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {participants.length > 0 ? (
              <>
                <span
                  className={`text-[11px] font-medium mr-1 ${
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
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-500 text-white shadow-sm'
                          : isDark
                          ? 'bg-[#181920] text-zinc-300 hover:bg-[#22242e] border border-white/[0.08]'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: isSelected ? '#ffffff' : person.avatarColor,
                        }}
                      />
                      <span>{person.name}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </>
            ) : (
              <span
                className={`text-[11px] ${
                  isDark ? 'text-zinc-500' : 'text-slate-400'
                }`}
              >
                Add participants above to split this item
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!itemName.trim() || !itemPrice}
            className="ios-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 disabled:opacity-40 cursor-pointer ml-auto"
          >
            + Add Item
          </button>
        </div>
      </form>

      {/* Bill Items List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
        {summary.unassignedItemsCount > 0 && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              isDark
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
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
            <span className="text-[11px] font-semibold text-amber-500">
              Select splitters below
            </span>
          </div>
        )}

        {/* Empty state when no items are on the bill */}
        {receipt.items.length === 0 && (
          <div
            className={`p-8 text-center rounded-xl border border-dashed flex flex-col items-center justify-center my-4 ${
              isDark
                ? 'border-white/[0.08] bg-[#121319]/50 text-zinc-400'
                : 'border-slate-300 bg-slate-50/50 text-slate-500'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 ${
                isDark
                  ? 'bg-zinc-800 text-zinc-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <h3
              className={`text-sm font-bold mb-1 ${
                isDark ? 'text-zinc-200' : 'text-slate-800'
              }`}
            >
              No items on this bill
            </h3>
            <p className="text-xs max-w-sm mb-3">
              Enter item names, prices, and assign participants above.
            </p>
            <button
              onClick={handleLoadDemo}
              className="text-xs font-semibold text-sky-500 hover:text-sky-400 flex items-center gap-1.5 cursor-pointer bg-sky-500/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load sample dinner</span>
            </button>
          </div>
        )}

        {receipt.items.map((item, idx) => {
          const assignedDiners = participants.filter((p) =>
            item.assignedTo.includes(p.id)
          );
          const isAssigned = assignedDiners.length > 0;
          const costEach = isAssigned ? item.price / assignedDiners.length : item.price;
          const isHighlighted = highlightedParticipantId ? item.assignedTo.includes(highlightedParticipantId) : false;
          const isDimmed = highlightedParticipantId ? !item.assignedTo.includes(highlightedParticipantId) : false;
          const isCurrentlyEditing = editingItemId === item.id;

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-4.5 rounded-2xl transition-all duration-200 border participant-lens-highlight ${
                isHighlighted
                  ? 'ring-2 ring-sky-500 scale-[1.01] shadow-xl z-10 ' + (isDark ? 'bg-[#181a26] border-sky-500/50' : 'bg-sky-50/50 border-sky-400')
                  : isDimmed
                  ? 'opacity-35 scale-[0.99] ' + (isDark ? 'bg-[#14151e] border-white/[0.04]' : 'bg-slate-50 border-slate-200')
                  : isAssigned
                  ? isDark
                    ? 'bg-[#14151e] border-white/[0.08] shadow-sm hover:border-white/20'
                    : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                  : isDark
                  ? 'bg-amber-950/15 border border-dashed border-amber-500/40 shadow-sm'
                  : 'bg-amber-50/50 border border-dashed border-amber-300'
              }`}
            >
              {isCurrentlyEditing ? (
                /* Inline Edit Mode */
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEditItem(item.id)}
                    className="ios-input text-xs font-bold px-3 py-2 rounded-lg flex-1 min-w-[160px]"
                    placeholder="Item name"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-zinc-400 select-none pointer-events-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step={activeCurrencyConfig.decimals === 0 ? '1' : '0.01'}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEditItem(item.id)}
                      className={`ios-input text-xs font-mono font-bold ${
                        currencySymbol.length > 2 ? 'pl-11' : 'pl-6'
                      } pr-2 py-2 rounded-lg w-full`}
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveEditItem(item.id)}
                    className="ios-btn-primary text-xs px-3 py-2 rounded-lg font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItemId(null)}
                    className="text-xs px-2.5 py-2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Standard Card Outlay: Top Information Row */
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-zinc-400 dark:text-zinc-500 select-none">
                        {(idx + 1).toString().padStart(2, '0')}.
                      </span>
                      <h4
                        onClick={() => handleStartEditItem(item)}
                        title="Click to edit name or price"
                        className={`font-extrabold text-sm sm:text-base tracking-tight cursor-pointer hover:underline ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {item.name}
                      </h4>
                      {item.quantity > 1 && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            isDark
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Qty {item.quantity}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEditItem(item)}
                        className="text-zinc-400 hover:text-sky-400 p-0.5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
                        title="Edit item name or price"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.quantity > 1 && (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 block">
                        {formatCurrency(item.price / item.quantity, receipt.currency)} each
                      </span>
                    )}
                  </div>

                  {/* Price & Action Cluster */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        onClick={() => handleStartEditItem(item)}
                        title="Click to edit price"
                        className="font-mono font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tabular-nums cursor-pointer hover:text-sky-500 transition-colors block"
                      >
                        {formatCurrency(item.price, receipt.currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-zinc-400 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Remove item"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Middle Calculation / Status Callout */}
              <div className="mb-3">
                {isAssigned ? (
                  assignedDiners.length > 1 ? (
                    <div
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${
                        isDark
                          ? 'bg-sky-950/20 border-sky-500/25 text-sky-300'
                          : 'bg-sky-50 border-sky-200 text-sky-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1 overflow-hidden">
                          {assignedDiners.map((diner) => (
                            <span
                              key={diner.id}
                              className="inline-block w-4 h-4 rounded-full ring-1 ring-white dark:ring-zinc-900"
                              style={{ backgroundColor: diner.avatarColor }}
                              title={diner.name}
                            />
                          ))}
                        </div>
                        <span className="font-semibold">
                          Split {assignedDiners.length} ways ({assignedDiners.map((d) => d.name).join(', ')})
                        </span>
                      </div>
                      <span className="font-mono font-bold tabular-nums">
                        {formatCurrency(costEach, receipt.currency)} each
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${
                        isDark
                          ? 'bg-[#181924] border-white/5 text-zinc-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: assignedDiners[0].avatarColor }}
                        />
                        <span className="font-medium">
                          Allocated to <strong className="text-white dark:text-white">{assignedDiners[0].name}</strong>
                        </span>
                      </div>
                      <span className="font-mono font-semibold">100% share</span>
                    </div>
                  )
                ) : (
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                      isDark
                        ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium">
                      Unassigned item ({formatCurrency(item.price, receipt.currency)}) · Tap participants below to split
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Participant Splitting Strip */}
              <div
                className={`pt-2.5 border-t flex flex-wrap items-center justify-between gap-2.5 ${
                  isDark ? 'border-white/[0.06]' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[11px] font-semibold mr-1 select-none ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    Split with:
                  </span>
                  {participants.length === 0 ? (
                    <span className="text-[11px] text-zinc-500 italic">
                      Add participants above to assign
                    </span>
                  ) : (
                    participants.map((person) => {
                      const isPersonAssigned = item.assignedTo.includes(person.id);
                      return (
                        <button
                          key={person.id}
                          onClick={() => onToggleItemAssignment(item.id, person.id)}
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                            isPersonAssigned
                              ? 'bg-sky-500 text-white shadow-xs'
                              : isDark
                              ? 'bg-[#181920] text-zinc-300 border border-white/[0.08] hover:bg-[#20222a] hover:text-white'
                              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
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
                    })
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-xs font-bold text-sky-500 shrink-0 ml-auto">
                  {participants.length > 1 && (
                    <button
                      onClick={() => onAssignItemToAll(item.id)}
                      className="hover:underline cursor-pointer"
                      title="Split this item equally among everyone"
                    >
                      Split All
                    </button>
                  )}
                  {isAssigned && (
                    <button
                      onClick={() => onClearItemAssignment(item.id)}
                      className="text-zinc-400 hover:text-rose-400 cursor-pointer transition-colors"
                      title="Clear split assignments"
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

      {/* Bill Summary Footer */}
      <div
        className={`pt-3.5 mt-2 border-t flex items-center justify-between ${
          isDark ? 'border-white/[0.08]' : 'border-slate-200/80'
        }`}
      >
        <div>
          <span className="text-sm font-bold block tracking-tight">Total Bill Due</span>
          <span
            className={`text-xs ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            Direct item sum ({receipt.currency})
          </span>
        </div>
        <span className="font-mono text-xl font-bold text-sky-500">
          {formatCurrency(summary.grandTotal, receipt.currency)}
        </span>
      </div>

      {onViewReceipt && (
        <button
          onClick={onViewReceipt}
          className="w-full mt-3 py-2.5 rounded-xl ios-btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm font-bold cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>View Receipt</span>
          <span className="font-mono opacity-90 font-medium">
            ({formatCurrency(summary.grandTotal, receipt.currency)})
          </span>
          <span className="text-base leading-none">→</span>
        </button>
      )}
    </div>
  );
};
