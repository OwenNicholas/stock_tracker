"use client"

import { useState, useEffect } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { SiteHeader } from "@/components/site-header"
import { apiService, type Product } from "@/lib/api"

export default function StockPage() {
  const [stockData, setStockData] = useState<Product[]>([])
  const [filteredData, setFilteredData] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Product>>({})

  // Get today's date
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Calculate stock_akhir and qty_di_pesan for a product
  const calculateStockValues = (stock_awal: number, keluar: number) => {
    const stock_akhir = stock_awal - keluar;
    const qty_di_pesan = Math.max(0, keluar * 3 - stock_akhir);
    return { stock_akhir, qty_di_pesan };
  }

  // Fetch stock data from API
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use the new stock endpoint that reads from daily snapshot
        const response = await apiService.getCurrentStock()
        
        if (response.success && response.data) {
          setStockData(response.data)
          setFilteredData(response.data)
        } else {
          setError(response.error || 'Failed to fetch stock data')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error('Error fetching stock data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [])

  // Filter data based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(stockData)
    } else {
      const filtered = stockData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredData(filtered)
    }
  }, [searchTerm, stockData])

  // Start editing a row
  const startEditing = (item: Product) => {
    const calculated = calculateStockValues(item.stock_awal, item.keluar);
    setEditingId(item.id)
    setEditForm({
      name: item.name,
      stock_awal: item.stock_awal,
      keluar: item.keluar,
      stock_akhir: calculated.stock_akhir,
      qty_di_pesan: calculated.qty_di_pesan
    })
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({})
  }

  // Save changes
  const saveChanges = async () => {
    if (!editingId) return

    try {
      // Call the API to update the stock (only send base values)
      const response = await apiService.updateStock(editingId, {
        name: editForm.name || '',
        stock_awal: editForm.stock_awal || 0,
        keluar: editForm.keluar || 0
      })

      if (response.success && response.data) {
        // Update the local state with the response from API
        const updatedData = stockData.map(item => 
          item.id === editingId 
            ? response.data!
            : item
        )
        
        setStockData(updatedData)
        
        // Update filtered data if needed
        if (searchTerm.trim() === "") {
          setFilteredData(updatedData)
        } else {
          const filtered = updatedData.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          setFilteredData(filtered)
        }

        setEditingId(null)
        setEditForm({})
      } else {
        throw new Error(response.error || 'Failed to update stock')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Failed to save changes. Please try again.')
      // Revert changes on error
      cancelEditing()
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof Product, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <LayoutWrapper>
      <SiteHeader />
      <main className="flex-1 bg-gray-50 w-full">
        <div className="p-6 w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
          <span className="text-lg text-gray-600 font-medium">{today}</span>
        </div>
        <p className="text-gray-600">Monitor and manage your inventory stock levels</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading stock data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 flex justify-end">
        <div className="relative w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 w-1/3">
                  Product Name
                </th>
                <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 w-1/6">
                  STOCK AWAL
                </th>
                <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 w-1/6">
                  KELUAR
                </th>
                <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 w-1/6">
                  STOCK AKHIR
                </th>
                <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 w-1/6">
                  QTY DI PESAN
                </th>
                <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 w-1/12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-500">Loading stock data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? `No products found matching "${searchTerm}"` : 'No products found'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 md:px-6 w-1/3">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 md:px-6 w-1/6">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editForm.stock_awal || ''}
                        onChange={(e) => handleInputChange('stock_awal', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      item.stock_awal
                    )}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 md:px-6 w-1/6">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editForm.keluar || ''}
                        onChange={(e) => handleInputChange('keluar', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      item.keluar
                    )}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 md:px-6 w-1/6">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editForm.stock_akhir || ''}
                        onChange={(e) => handleInputChange('stock_akhir', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className={`font-medium ${calculateStockValues(item.stock_awal, item.keluar).stock_akhir < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {calculateStockValues(item.stock_awal, item.keluar).stock_akhir}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 md:px-6 w-1/6">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editForm.qty_di_pesan || ''}
                        onChange={(e) => handleInputChange('qty_di_pesan', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className={`font-medium ${calculateStockValues(item.stock_awal, item.keluar).qty_di_pesan > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {calculateStockValues(item.stock_awal, item.keluar).qty_di_pesan}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 md:px-6 w-1/12">
                    {editingId === item.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveChanges}
                          className="text-green-600 hover:text-green-900 font-medium text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-600 hover:text-red-900 font-medium text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(item)}
                        className="text-blue-600 hover:text-blue-900 font-medium text-xs"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search Results Summary */}
      {searchTerm && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredData.length} of {stockData.length} products
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Daily Stock System & Calculation Logic</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>STOCK AKHIR</strong> = STOCK AWAL - KELUAR</li>
          <li>• <strong>QTY DI PESAN</strong> = KELUAR × 3 - STOCK AKHIR</li>
          <li>• <strong>QTY DI PESAN</strong> stays the same throughout the day</li>
          <li>• <strong>At midnight</strong>, QTY DI PESAN is automatically added to STOCK AWAL for the next day</li>
          <li>• <strong>QTY DI PESAN</strong> then resets to 0 for the new day</li>
        </ul>
        <p className="text-sm text-blue-700 mt-2">
          <strong>Note:</strong> Click the "Edit" button on any row to modify values. Changes are automatically saved to the database and stock transactions are recorded for audit purposes. The daily rollover happens automatically at midnight.
        </p>
      </div>
        </div>
      </main>
    </LayoutWrapper>
  )
} 